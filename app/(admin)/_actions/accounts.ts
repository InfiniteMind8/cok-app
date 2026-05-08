'use server'

import { withAdminAction, type AuthUser } from '@/lib/action'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/service'
import { generateUniqueMemberId } from '@/lib/member-id'
import { clerkClient } from '@clerk/nextjs/server'
import { Role, AttachmentEntityType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

interface AttachmentInput {
  storageKey: string
  mimeType: string
  sizeBytes: number
  name: string
  fieldName: string
}

interface ResidentFields {
  preferredName?: string
  gender?: string
  nationalIdType?: string
  nationalIdNumber?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  householdSize?: number
  vehiclePlates?: string[]
  notes?: string
}

interface VisitorFields {
  nationalIdType?: string
  nationalIdNumber?: string
  visitPurpose?: string
  expectedArrival?: string
  expectedDeparture?: string
  hostId?: string
}

interface VendorFields {
  businessName?: string
  businessCategory?: string
  payoutMethod?: string
  kcrdWalletPreference?: boolean
  notes?: string
}

interface CreateAccountInput {
  fullName: string
  email: string
  role: Role
  preferredName?: string
  phone?: string
  gender?: string
  dob?: string
  govId?: string
  country?: string
  residentFields?: ResidentFields
  visitorFields?: VisitorFields
  vendorFields?: VendorFields
  attachments?: AttachmentInput[]
  groupIds?: string[]
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function _createAccountAction(actor: AuthUser, input: CreateAccountInput) {
  const memberId = await generateUniqueMemberId()

  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        memberId,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        status: 'PENDING_KYC',
        preferredName: input.preferredName?.trim() ?? null,
        phone: input.phone?.trim() ?? null,
        gender: input.gender?.trim() ?? null,
        nationalIdType: input.residentFields?.nationalIdType ?? input.visitorFields?.nationalIdType ?? null,
        nationalIdNumber: input.residentFields?.nationalIdNumber ?? input.visitorFields?.nationalIdNumber ?? null,
        emergencyContactName: input.residentFields?.emergencyContactName ?? null,
        emergencyContactPhone: input.residentFields?.emergencyContactPhone ?? null,
        householdSize: input.residentFields?.householdSize ?? null,
        vehiclePlates: input.residentFields?.vehiclePlates ?? [],
        notes: input.residentFields?.notes ?? input.vendorFields?.notes ?? null,
        kyc: {
          dob: input.dob ?? null,
          govId: input.govId ?? null,
          country: input.country ?? null,
        },
      },
    })

    await tx.wallet.create({ data: { userId: newUser.id } })

    if (input.role === 'VISITOR' && input.visitorFields) {
      await tx.visitorProfile.create({
        data: {
          userId: newUser.id,
          visitPurpose: input.visitorFields.visitPurpose ?? null,
          expectedArrival: input.visitorFields.expectedArrival
            ? new Date(input.visitorFields.expectedArrival)
            : null,
          expectedDeparture: input.visitorFields.expectedDeparture
            ? new Date(input.visitorFields.expectedDeparture)
            : null,
          hostId: input.visitorFields.hostId ?? null,
        },
      })
    }

    if (input.role === 'VENDOR' && input.vendorFields) {
      await tx.vendorProfile.create({
        data: {
          userId: newUser.id,
          businessName: input.vendorFields.businessName?.trim() ?? null,
          businessCategory: input.vendorFields.businessCategory ?? null,
          payoutMethod: input.vendorFields.payoutMethod ?? null,
          kcrdWalletPreference: input.vendorFields.kcrdWalletPreference ?? false,
        },
      })
    }

    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        await tx.attachment.create({
          data: {
            storageKey: att.storageKey,
            mimeType: att.mimeType,
            sizeBytes: BigInt(att.sizeBytes),
            name: att.name,
            entityType: AttachmentEntityType.USER,
            entityId: newUser.id,
            fieldName: att.fieldName,
            uploadedBy: actor.id,
          },
        })
      }
    }

    if (input.role === 'VISITOR' && input.groupIds && input.groupIds.length > 0) {
      await tx.visitorGroupMembership.createMany({
        data: input.groupIds.map((groupId) => ({
          groupId,
          userId: newUser.id,
          assignedById: actor.id,
        })),
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE_ACCOUNT',
        entity: 'User',
        entityId: newUser.id,
        actorId: actor.id,
        after: { memberId, role: input.role, email: input.email },
      },
    })

    return newUser
  })

  const clerk = await clerkClient()
  await clerk.invitations.createInvitation({
    emailAddress: input.email,
    redirectUrl: `${APP_URL}/sign-up`,
    ignoreExisting: true,
  })

  sendEmail({
    to: input.email,
    subject: 'Welcome to City of Karis',
    template: 'welcome',
    data: {
      fullName: input.fullName,
      memberId: user.memberId,
      role: input.role,
      loginUrl: `${APP_URL}/sign-in`,
    },
    idempotencyKey: `welcome:${user.id}`,
  }).catch(() => {})

  revalidatePath('/admin/accounts')
  return { memberId: user.memberId }
}

export const createAccountAction = withAdminAction(_createAccountAction, {
  roles: ['MASTER_ADMIN', 'ADMIN'],
})

async function _suspendAccountAction(_actor: AuthUser, userId: string, reason: string) {
  if (!reason.trim()) throw new Error('Suspension reason is required')

  const targetUser = await db.user.update({
    where: { id: userId },
    data: { status: 'SUSPENDED' },
  })

  if (targetUser.clerkId) {
    const clerk = await clerkClient()
    const sessions = await clerk.sessions.getSessionList({ userId: targetUser.clerkId })
    await Promise.all(
      sessions.data.map((s) => clerk.sessions.revokeSession(s.id).catch(() => {})),
    )
  }

  revalidatePath('/admin/accounts')
}

export const suspendAccountAction = withAdminAction(_suspendAccountAction, {
  roles: ['MASTER_ADMIN'],
})

async function _restoreAccountAction(_actor: AuthUser, userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  })
  revalidatePath('/admin/accounts')
}

export const restoreAccountAction = withAdminAction(_restoreAccountAction, {
  roles: ['MASTER_ADMIN'],
})

async function _upgradeRoleAction(_actor: AuthUser, userId: string, targetRole: Role) {
  await db.user.update({
    where: { id: userId },
    data: { role: targetRole },
  })
  revalidatePath('/admin/accounts')
}

export const upgradeRoleAction = withAdminAction(_upgradeRoleAction, {
  roles: ['MASTER_ADMIN'],
})
