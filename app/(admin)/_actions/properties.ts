'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { PropertyType, PropertyCategory, PropertyStatus, AttachmentEntityType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createAttachment, type CreateAttachmentInput } from '@/lib/storage/attachments'

interface AttachmentInput {
  storageKey: string
  mimeType: string
  sizeBytes: number
  name: string
  fieldName: string
}

export async function createPropertyAction(input: {
  code: string
  type: PropertyType
  category: PropertyCategory
  address?: string
  addressLine2?: string
  lotNumber?: string
  totalPrice?: string
  currentValuationKcrd?: string
  sizeSqm?: string
  bedrooms?: string
  bathrooms?: string
  parkingSpots?: string
  yearBuilt?: string
  propertyStatus?: PropertyStatus
  notes?: string
  specifications?: Record<string, string>
  photos?: string[]
  attachments?: AttachmentInput[]
}) {
  const user = await requireRole(['MASTER_ADMIN'])

  const property = await db.$transaction(async (tx) => {
    const prop = await tx.property.create({
      data: {
        code: input.code.trim().toUpperCase(),
        type: input.type,
        category: input.category,
        address: input.address?.trim() ?? null,
        totalPrice: input.totalPrice ? input.totalPrice : null,
        currentValuationKcrd: input.currentValuationKcrd ? input.currentValuationKcrd : null,
        specifications: input.specifications ?? {},
        photos: input.photos ?? [],
        lotNumber: input.lotNumber?.trim() ?? null,
        sizeSqm: input.sizeSqm ? input.sizeSqm : null,
        bedrooms: input.bedrooms ? parseInt(input.bedrooms, 10) : null,
        bathrooms: input.bathrooms ? parseInt(input.bathrooms, 10) : null,
        parkingSpots: input.parkingSpots ? parseInt(input.parkingSpots, 10) : null,
        yearBuilt: input.yearBuilt ? parseInt(input.yearBuilt, 10) : null,
        propertyStatus: input.propertyStatus ?? 'VACANT',
        notes: input.notes?.trim() ?? null,
      },
    })

    // Create Attachment rows for each uploaded file
    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        await tx.attachment.create({
          data: {
            storageKey: att.storageKey,
            mimeType: att.mimeType,
            sizeBytes: BigInt(att.sizeBytes),
            name: att.name,
            entityType: AttachmentEntityType.PROPERTY,
            entityId: prop.id,
            fieldName: att.fieldName,
            uploadedBy: user.id,
          },
        })
      }
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE_PROPERTY',
        entity: 'Property',
        entityId: prop.id,
        actorId: user.id,
        after: { code: prop.code, type: prop.type, category: prop.category },
      },
    })

    return prop
  })

  revalidatePath('/admin/properties')
  return { propertyId: property.id }
}

export async function addInstallmentAction(input: {
  propertyId: string
  number: number
  dueDate: string
  amount: string
  progressNote?: string
}) {
  await requireRole(['MASTER_ADMIN'])

  await db.propertyInstallment.create({
    data: {
      propertyId: input.propertyId,
      number: input.number,
      dueDate: new Date(input.dueDate),
      amount: input.amount,
      progressNote: input.progressNote?.trim() ?? null,
    },
  })

  revalidatePath(`/admin/properties/${input.propertyId}`)
}

export async function assignOwnerAction(input: {
  propertyId: string
  userId: string
  ownershipPct: number
  contractDate: string
  contractUrl?: string
}) {
  await requireRole(['MASTER_ADMIN'])

  await db.propertyOwnership.create({
    data: {
      propertyId: input.propertyId,
      userId: input.userId,
      ownershipPct: input.ownershipPct,
      contractDate: new Date(input.contractDate),
      contractUrl: input.contractUrl ?? null,
    },
  })

  revalidatePath(`/admin/properties/${input.propertyId}`)
}

export async function assignTenantAction(input: {
  propertyId: string
  userId: string
  cycle: string
  cyclePayment: string
  contractDate: string
  contractUrl?: string
  startDate?: string
  endDate?: string
  depositAmount?: string
  leaseAgreementKey?: string
  leaseAgreementName?: string
  leaseAgreementSize?: number
  leaseAgreementMime?: string
}) {
  const user = await requireRole(['MASTER_ADMIN'])

  await db.$transaction(async (tx) => {
    const tenancy = await tx.propertyTenancy.create({
      data: {
        propertyId: input.propertyId,
        userId: input.userId,
        cycle: input.cycle,
        cyclePayment: input.cyclePayment,
        contractDate: new Date(input.contractDate),
        contractUrl: input.contractUrl ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        depositAmount: input.depositAmount ? input.depositAmount : null,
      },
    })

    if (input.leaseAgreementKey && input.leaseAgreementName) {
      await tx.attachment.create({
        data: {
          storageKey: input.leaseAgreementKey,
          mimeType: input.leaseAgreementMime ?? 'application/pdf',
          sizeBytes: BigInt(input.leaseAgreementSize ?? 0),
          name: input.leaseAgreementName,
          entityType: AttachmentEntityType.LEASE,
          entityId: tenancy.id,
          fieldName: 'leaseAgreement',
          uploadedBy: user.id,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'ASSIGN_TENANT',
        entity: 'PropertyTenancy',
        entityId: tenancy.id,
        actorId: user.id,
        after: {
          propertyId: input.propertyId,
          userId: input.userId,
          cycle: input.cycle,
        },
      },
    })
  })

  revalidatePath(`/admin/properties/${input.propertyId}`)
}

export async function addPropertyPaymentAction(input: {
  installmentId: string
  ownershipId: string
  amount: string
  paidAt: string
  proofUrl?: string
}) {
  await requireRole(['MASTER_ADMIN'])

  await db.propertyPayment.create({
    data: {
      installmentId: input.installmentId,
      ownershipId: input.ownershipId,
      amount: input.amount,
      paidAt: new Date(input.paidAt),
      proofUrl: input.proofUrl ?? null,
    },
  })

  const installment = await db.propertyInstallment.findUnique({
    where: { id: input.installmentId },
    select: { propertyId: true },
  })
  if (installment) revalidatePath(`/admin/properties/${installment.propertyId}`)
}
