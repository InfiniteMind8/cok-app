import fs from 'node:fs/promises'
import path from 'node:path'
import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/legal-document'

export const metadata: Metadata = {
  title: 'Privacy Policy · City of Karis',
  description: 'How the City of Karis Community App handles your data.',
}

export default async function PrivacyPage() {
  const md = await fs.readFile(path.join(process.cwd(), 'legal', 'privacy.md'), 'utf-8')
  return <LegalDocument markdown={md} title="Privacy Policy" />
}
