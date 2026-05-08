'use server'

import { withAdminAction, type AuthUser } from '@/lib/action'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/service'
import { generateUniqueMemberId } from '@/lib/member-id'
import { parseMembersSheet } from '@/lib/imports/members-parser'
import { parsePropertiesSheet } from '@/lib/imports/properties-parser'
import { createAttachment } from '@/lib/storage/attachments'
import { createAuditEntry } from '@/lib/audit'
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

async function _parseAndStoreImportAction(actor: AuthUser, formData: FormData) {
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    throw new Error('No file uploaded. Please attach an .xlsx file.')
  }
  if (!file.name.endsWith('.xlsx')) {
    throw new Error('Only .xlsx files are accepted.')
  }

  const buffer = await file.arrayBuffer()
  const fileHash = await computeFileHash(buffer)

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

export const parseAndStoreImportAction = withAdminAction(_parseAndStoreImportAction, {
  roles: ['MASTER_ADMIN'],
  scope: 'bulk-import',
})

async function _commitImportAction(actor: AuthUser, sessionId: string, confirmedRowIds: string[]) {
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

export const commitImportAction = withAdminAction(_commitImportAction, {
  roles: ['MASTER_ADMIN'],
  scope: 'bulk-import',
})

async function _cancelImportAction(actor: AuthUser, sessionId: string) {
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

export const cancelImportAction = withAdminAction(_cancelImportAction, {
  roles: ['MASTER_ADMIN'],
  scope: 'bulk-import',
})

// ─── Property import actions ──────────────────────────────────────────────────

interface AttachmentMeta {
  key: string
  name: string
  mimeType: string
  sizeBytes: number
  fieldName: string
}

type ZipAttachmentsMap = Record<string, AttachmentMeta[]>

async function processCompanionZip(zipFile: File): Promise<ZipAttachmentsMap> {
  const hasToken = !!process.env.UPLOADTHING_TOKEN
  if (!hasToken) {
    console.warn('[D.2] UPLOADTHING_TOKEN absent — companion zip skipped')
    return {}
  }

  const JSZip = (await import('jszip')).default
  const { UTApi } = await import('uploadthing/server')
  const utapi = new UTApi()

  const zipBuffer = await zipFile.arrayBuffer()
  const zip = await JSZip.loadAsync(zipBuffer)

  const ALLOWED_SUBFOLDERS = ['photos', 'title-deed', 'occupancy-permit', 'utility']
  const attachmentsMap: ZipAttachmentsMap = {}

  const uploadBatch: { externalRef: string; fieldName: string; name: string; file: File }[] = []

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return
    const parts = relativePath.replace(/\\/g, '/').split('/')
    if (parts.length < 3) return
    const [externalRef, subfolder, ...rest] = parts
    if (!ALLOWED_SUBFOLDERS.includes(subfolder)) return
    const fileName = rest.join('/')
    if (!fileName) return

    uploadBatch.push({ externalRef, fieldName: subfolder, name: fileName, file: null as unknown as File })
    const entry = zipEntry
    const idx = uploadBatch.length - 1
    ;(async () => {
      const buf = await entry.async('arraybuffer')
      const mimeType = guessMimeType(fileName)
      uploadBatch[idx].file = new File([buf], fileName, { type: mimeType })
    })()
  })

  await new Promise((r) => setTimeout(r, 100))

  const validBatch = uploadBatch.filter((b) => b.file !== null)
  if (validBatch.length === 0) return {}

  const uploadResults = await utapi.uploadFiles(validBatch.map((b) => b.file))

  for (let i = 0; i < validBatch.length; i++) {
    const item = validBatch[i]
    const result = uploadResults[i]
    if (result.error || !result.data) continue
    if (!attachmentsMap[item.externalRef]) attachmentsMap[item.externalRef] = []
    attachmentsMap[item.externalRef].push({
      key: result.data.key,
      name: item.name,
      mimeType: item.file.type,
      sizeBytes: item.file.size,
      fieldName: item.fieldName,
    })
  }

  return attachmentsMap
}

function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
    gif: 'image/gif',
  }
  return map[ext] ?? 'application/octet-stream'
}

async function _parseAndStorePropertyImportAction(actor: AuthUser, formData: FormData) {
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    throw new Error('No file uploaded. Please attach an .xlsx file.')
  }
  if (!file.name.endsWith('.xlsx')) {
    throw new Error('Only .xlsx files are accepted.')
  }

  const zipFile = formData.get('zipFile')
  const hasZip = zipFile instanceof File && zipFile.size > 0

  if (hasZip && zipFile.size > 50 * 1024 * 1024) {
    throw new Error('Companion zip must be under 50 MB.')
  }

  const buffer = await file.arrayBuffer()
  const fileHash = await computeFileHash(buffer)

  const existingCodeRows = await db.property.findMany({ select: { code: true } })
  const existingCodes = new Set(existingCodeRows.map((p) => p.code))

  const parsedRows = await parsePropertiesSheet(buffer, existingCodes)

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

  let zipAttachments: ZipAttachmentsMap = {}
  if (hasZip) {
    zipAttachments = await processCompanionZip(zipFile)
  }

  const session = await db.$transaction(async (tx) => {
    const s = await tx.importSession.create({
      data: {
        type: 'properties',
        fileName: file.name,
        fileHash,
        totalRows: parsedRows.length,
        validCount,
        warningCount,
        errorCount,
        actorId: actor.id,
        status: 'UPLOADED',
        metadata: hasZip ? ({ zip_attachments: zipAttachments } as object) : undefined,
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
          type: 'properties',
          fileName: file.name,
          fileHash,
          totalRows: parsedRows.length,
          validCount,
          warningCount,
          errorCount,
          hasCompanionZip: hasZip,
        },
      },
    })

    return s
  })

  redirect(`/admin/imports/properties/${session.id}`)
}

export const parseAndStorePropertyImportAction = withAdminAction(_parseAndStorePropertyImportAction, {
  roles: ['MASTER_ADMIN'],
  scope: 'bulk-import',
})

async function _commitPropertyImportAction(actor: AuthUser, sessionId: string, confirmedRowIds: string[]) {
  const session = await db.importSession.findUnique({
    where: { id: sessionId },
    include: { rows: true },
  })
  if (!session) throw new Error('Import session not found.')
  if (session.status !== 'UPLOADED') {
    throw new Error(`This import session has already been ${session.status.toLowerCase()}.`)
  }

  const zipAttachments: ZipAttachmentsMap =
    (session.metadata as { zip_attachments?: ZipAttachmentsMap } | null)?.zip_attachments ?? {}

  const confirmedSet = new Set(confirmedRowIds)
  const toProcess = session.rows.filter(
    (r) => r.status === 'VALID' || (r.status === 'WARNING' && confirmedSet.has(r.id)),
  )

  let committedCount = 0
  let skippedCount = 0

  for (const record of toProcess) {
    const rowData = record.rowData as Record<string, string>
    try {
      const code =
        rowData.external_ref?.trim() ||
        `IMP-${String(record.rowNumber - 1).padStart(4, '0')}`

      const address = [rowData.address_line_1, rowData.address_line_2]
        .filter(Boolean)
        .join(', ')

      const property = await db.$transaction(async (tx) => {
        const prop = await tx.property.create({
          data: {
            code,
            type: rowData.type as 'OWNERSHIP' | 'RENTAL' | 'ADMIN',
            category: 'RESIDENTIAL',
            address: address || null,
            lotNumber: rowData.lot_number || null,
            sizeSqm: rowData.size_sqm ? parseFloat(rowData.size_sqm) : null,
            bedrooms: rowData.bedrooms ? parseInt(rowData.bedrooms, 10) : null,
            bathrooms: rowData.bathrooms ? parseInt(rowData.bathrooms, 10) : null,
            parkingSpots: rowData.parking_spots ? parseInt(rowData.parking_spots, 10) : null,
            yearBuilt: rowData.year_built ? parseInt(rowData.year_built, 10) : null,
            propertyStatus: (rowData.status as 'VACANT' | 'OCCUPIED' | 'UNDER_CONSTRUCTION') || 'VACANT',
            totalPrice: rowData.purchase_price_kcrd ? parseFloat(rowData.purchase_price_kcrd) : null,
            currentValuationKcrd: rowData.current_valuation_kcrd
              ? parseFloat(rowData.current_valuation_kcrd)
              : null,
            notes: rowData.notes || null,
            specifications: {
              size_sqm: rowData.size_sqm || null,
              bedrooms: rowData.bedrooms || null,
              bathrooms: rowData.bathrooms || null,
              parking_spots: rowData.parking_spots || null,
              year_built: rowData.year_built || null,
            },
          },
        })

        await tx.auditLog.create({
          data: {
            action: 'IMPORT_CREATE_PROPERTY',
            entity: 'Property',
            entityId: prop.id,
            actorId: actor.id,
            after: {
              code,
              address,
              importSessionId: sessionId,
              importRowId: record.id,
            },
          },
        })

        return prop
      })

      await db.importRecord.update({
        where: { id: record.id },
        data: { createdEntityId: property.id },
      })

      const attachmentKey = rowData.external_ref?.trim()
      if (attachmentKey && zipAttachments[attachmentKey]) {
        for (const att of zipAttachments[attachmentKey]) {
          await createAttachment({
            storageKey: att.key,
            mimeType: att.mimeType,
            sizeBytes: att.sizeBytes,
            name: att.name,
            entityType: 'PROPERTY',
            entityId: property.id,
            fieldName: att.fieldName,
            uploadedBy: actor.id,
          })
        }
      }

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
        type: 'properties',
        fileName: session.fileName,
        committedCount,
        skippedCount,
        totalProcessed: toProcess.length,
      },
    },
  })

  revalidatePath('/admin/properties')
  return { committedCount, skippedCount }
}

export const commitPropertyImportAction = withAdminAction(_commitPropertyImportAction, {
  roles: ['MASTER_ADMIN'],
  scope: 'bulk-import',
})

async function _cancelPropertyImportAction(actor: AuthUser, sessionId: string) {
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
      after: { type: 'properties', fileName: session.fileName },
    },
  })

  redirect('/admin/imports/properties')
}

export const cancelPropertyImportAction = withAdminAction(_cancelPropertyImportAction, {
  roles: ['MASTER_ADMIN'],
  scope: 'bulk-import',
})
