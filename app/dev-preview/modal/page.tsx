import { notFound } from 'next/navigation'
import { ModalPreviewClient } from './_client'

export default function ModalPreviewPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    notFound()
  }
  return <ModalPreviewClient />
}
