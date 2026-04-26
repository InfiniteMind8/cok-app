import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { requireRole } from '@/lib/auth'

const f = createUploadthing()

export const ourFileRouter = {
  proofOfPayment: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
    pdf: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  propertyPhotos: f({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  contractDocuments: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
