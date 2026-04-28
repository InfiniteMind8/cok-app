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

  // B.3: property legal/permit documents (title deed, occupancy permit, utility docs)
  propertyDocuments: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // B.3: resident/visitor ID scan and profile photo
  profileDocuments: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN', 'ADMIN'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // B.3: issue report photos and video
  issueMedia: f({
    image: { maxFileSize: '8MB', maxFileCount: 5 },
    video: { maxFileSize: '64MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN', 'ADMIN', 'RESIDENT', 'VISITOR'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // B.3: vendor business license and insurance certificate
  vendorDocuments: f({
    pdf: { maxFileSize: '8MB', maxFileCount: 2 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN', 'ADMIN'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // B.3: lease agreement PDF
  leaseDocuments: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await requireRole(['MASTER_ADMIN'])
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // B.3: voucher optional attachment (PDF up to 5 MB, closest valid: 4MB)
  voucherAttachments: f({
    pdf: { maxFileSize: '4MB', maxFileCount: 1 },
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
