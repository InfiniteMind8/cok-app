'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/service'
import { generateUniqueMemberId } from '@/lib/member-id'
import { parseMembersSheet } from '@/lib/imports/members-parser'
import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const MAX_IMPORT_ROWS = parseInt(process.env.IMPORT_MAX_ROWS ?? '1000', 10)

async function computeFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function parseAndStoreImportAction(formData: FormData) {
  const actor = await requireRole(['MASTER_ADMIN'])

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    throw new Error('No file uploaded. Please attach an .xlsx file.')
  }
  if (!file.name.endsWith('.xlsx')) {
    throw new Error('Only .xlsx files are accepted.')
  }

  const buffer = await file.arrayBuffer()
  const fileHash = await computeFileHash(buffer)

  // Parse first to count rows before storing
  // Fetch existing emails for duplicate detection
  const existingEmailRows = await db.user.findMany({ select: { email: true } })
  const existingEmails = new Set(existingEmailRows.map((u) => u.email))

  const parsedRows = await parseMembersSheet(buffer, existingEmails)

  if (parsedRows.length === 0) {
    throw new Error('The spreadsheet has no data rows. Check that the file uses the correct template.')
  }
  if (parsedRows.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `This file contains ${parsedRows.length} rows, which exceeds the limit of ${MAX_IMPORT_ROWS}. ` +
        `Split the file and import in batches.`,
    )
  }

  const validCount = parsedRows.filter((r) => r.status === 'VALID').length
  const warningCount = parsedRows.filter((r) => r.status === 'WARNING').length
  const errorCount = parsedRows.filter((r) => r.status === 'ERROR').length

  const session = await db.$transaction(async (tx) => {
    const s = await tx.importSession.create({
      data: {
        type: 'members',
        fileName: file.name,
        fileHash,
        totalRows: parsedRows.length,
        validCount,
        warningCount,
        errorCount,
        actorId: actor.id,
        status: 'UPLOADED',
      },
    })

    await tx.importRecord.createMany({
      data: parsedRows.map((row) => ({
        sessionId: s.id,
        rowNumber: row.rowNumber,
        rowData: row.rowData as object,
        status: row.status,
        messages: row.messages,
      })),
    })

    await tx.auditLog.create({
      data: {
        action: 'IMPORT_UPLOAD',
        entity: 'ImportSession',
        entityId: s.id,
        actorId: actor.id,
        after: {
          fileName: file.name,
          fileHash,
          totalRows: parsedRows.length,
          validCount,
          warningCount,
          errorCount,
        },
      },
    })

    return s
  })

  redirect(`/admin/imports/members/${session.id}`)
}

export async function commitImportAction(sessionId: string, confirmedRowIds: string[]) {
  const actor = await requireRole(['MASTER_ADMIN'])

  const session = await db.importSession.findUnique({
    where: { id: sessionId },
    include: { rows: true },
  })
  if (!session) throw new Error('Import session not found.')
  if (session.status !== 'UPLOADED') {
    throw new Error(`This import session has already been ${session.status.toLowerCase()}.`)
  }

  const confirmedSet = new Set(confirmedRowIds)
  const toProcess = session.rows.filter(
    (r) => r.status === 'VALID' || (r.status === 'WARNING' && confirmedSet.has(r.id)),
  )

  let committedCount = 0
  let skippedCount = 0
  const clerk = await clerkClient()

  for (const record of toProcess) {
    const rowData = record.rowData as Record<string, string>
    try {
      const memberId = await generateUniqueMemberId()

      const plates: string[] = rowData.vehicle_plates
        ? rowData.vehicle_plates
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : []

      const user = await db.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            memberId,
            email: rowData.email,
            fullName: rowData.full_name,
            role: 'RESIDENT',
            status: 'PENDING_KYC',
            preferredName: rowData.preferred_name || null,
            phone: rowData.phone_e164 || null,
            gender: rowData.gender || null,
            nationalIdType: rowData.national_id_type || null,
            nationalIdNumber: rowData.national_id_number || null,
            emergencyContactName: rowData.emergency_contact_name || null,
            emergencyContactPhone: rowData.emergency_contact_phone || null,
            householdSize: rowData.household_size ? parseInt(rowData.household_size, 10) || null : null,
            vehiclePlates: plates,
            notes: rowData.notes || null,
            kyc: {
              dob: rowData.dob || null,
              govId: null,
              country: null,
            },
          },
        })

        await tx.wallet.create({ data: { userId: newUser.id } })

        await tx.auditLog.create({
          data: {
            action: 'IMPORT_CREATE_MEMBER',
            entity: 'User',
            entityId: newUser.id,
            actorId: actor.id,
            after: {
              memberId,
              email: rowData.email,
              importSessionId: sessionId,
              importRowId: record.id,
            },
          },
        })

        return newUser
      })

      await db.importRecord.update({
        where: { id: record.id },
        data: { createdEntityId: user.id },
      })

      await clerk.invitations.createInvitation({
        emailAddress: rowData.email,
        redirectUrl: `${APP_URL}/sign-up`,
        ignoreExisting: true,
      })

      sendEmail({
        to: rowData.email,
        subject: 'Welcome to City of Karis',
        template: 'welcome',
        data: {
          fullName: rowData.full_name,
          memberId: user.memberId,
          role: 'RESIDENT',
          loginUrl: `${APP_URL}/sign-in`,
        },
        idempotencyKey: `welcome:${user.id}`,
      }).catch(() => {})

      committedCount++
    } catch {
      skippedCount++
    }
  }

  await db.importSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMMITTED',
      committedCount,
      skippedCount,
      completedAt: new Date(),
    },
  })

  await db.auditLog.create({
    data: {
      action: 'IMPORT_SESSION_COMMITTED',
      entity: 'ImportSession',
      entityId: sessionId,
      actorId: actor.id,
      after: {
        fileName: session.fileName,
        committedCount,
        skippedCount,
        totalProcessed: toProcess.length,
      },
    },
  })

  revalidatePath('/admin/accounts')
  return { committedCount, skippedCount }
}

export async function cancelImportAction(sessionId: string) {
  const actor = await requireRole(['MASTER_ADMIN'])

  const session = await db.importSession.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error('Import session not found.')
  if (session.status !== 'UPLOADED') throw new Error('Only UPLOADED sessions can be cancelled.')

  await db.importSession.update({
    where: { id: sessionId },
    data: { status: 'CANCELLED', completedAt: new Date() },
  })

  await db.auditLog.create({
    data: {
      action: 'IMPORT_SESSION_CANCELLED',
      entity: 'ImportSession',
      entityId: sessionId,
      actorId: actor.id,
      after: { fileName: session.fileName },
    },
  })

  redirect('/admin/imports/members')
}
