import 'server-only'
import { db } from '@/lib/db'
import { AttachmentEntityType } from '@prisma/client'

export type { AttachmentEntityType }

export interface CreateAttachmentInput {
  storageKey: string
  mimeType: string
  sizeBytes: number
  name: string
  entityType: AttachmentEntityType
  entityId: string
  fieldName: string
  uploadedBy: string
}

export async function createAttachment(input: CreateAttachmentInput) {
  return db.attachment.create({
    data: {
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      sizeBytes: BigInt(input.sizeBytes),
      name: input.name,
      entityType: input.entityType,
      entityId: input.entityId,
      fieldName: input.fieldName,
      uploadedBy: input.uploadedBy,
    },
  })
}

export async function getAttachmentsByEntity(
  entityType: AttachmentEntityType,
  entityId: string,
) {
  return db.attachment.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getAttachmentsByEntityAndField(
  entityType: AttachmentEntityType,
  entityId: string,
  fieldName: string,
) {
  return db.attachment.findMany({
    where: { entityType, entityId, fieldName },
    orderBy: { createdAt: 'asc' },
  })
}
