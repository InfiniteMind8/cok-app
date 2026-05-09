import fs from 'node:fs/promises'
import path from 'node:path'
import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/legal-document'

export const metadata: Metadata = {
  title: 'Terms of Service · City of Karis',
  description: 'Terms governing use of the City of Karis Community App.',
}

export default async function TermsPage() {
  const md = await fs.readFile(path.join(process.cwd(), 'legal', 'terms.md'), 'utf-8')
  return <LegalDocument markdown={md} title="Terms of Service" />
}
