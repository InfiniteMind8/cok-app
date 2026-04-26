'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { PropertyType, PropertyCategory } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createPropertyAction(input: {
  code: string
  type: PropertyType
  category: PropertyCategory
  address?: string
  totalPrice?: string
  specifications?: Record<string, string>
  photos?: string[]
}) {
  await requireRole(['MASTER_ADMIN'])

  const property = await db.property.create({
    data: {
      code: input.code.trim().toUpperCase(),
      type: input.type,
      category: input.category,
      address: input.address?.trim() ?? null,
      totalPrice: input.totalPrice ? input.totalPrice : null,
      specifications: input.specifications ?? {},
      photos: input.photos ?? [],
    },
  })

  revalidatePath('/properties')
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

  revalidatePath(`/properties/${input.propertyId}`)
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

  revalidatePath(`/properties/${input.propertyId}`)
}

export async function assignTenantAction(input: {
  propertyId: string
  userId: string
  cycle: string
  cyclePayment: string
  contractDate: string
  contractUrl?: string
}) {
  await requireRole(['MASTER_ADMIN'])

  await db.propertyTenancy.create({
    data: {
      propertyId: input.propertyId,
      userId: input.userId,
      cycle: input.cycle,
      cyclePayment: input.cyclePayment,
      contractDate: new Date(input.contractDate),
      contractUrl: input.contractUrl ?? null,
    },
  })

  revalidatePath(`/properties/${input.propertyId}`)
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
  if (installment) revalidatePath(`/properties/${installment.propertyId}`)
}
