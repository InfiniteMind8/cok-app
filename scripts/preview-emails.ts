/**
 * Renders all email templates to HTML files in /qa/screenshots/emails/.
 * Run from the website/ directory: npx tsx scripts/preview-emails.ts
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { renderWelcome } from '../lib/email/templates/welcome'
import { renderCredentials } from '../lib/email/templates/credentials'
import { renderPasswordReset } from '../lib/email/templates/password-reset'
import { renderVoucherDelivery } from '../lib/email/templates/voucher-delivery'
import { renderSettlementConfirmation } from '../lib/email/templates/settlement-confirmation'
import { renderRentalExtensionDecision } from '../lib/email/templates/rental-extension-decision'
import { renderEmergencyBroadcast } from '../lib/email/templates/emergency-broadcast'
import { renderPropertyTransferDecision } from '../lib/email/templates/property-transfer-decision'
import { renderMfaReset } from '../lib/email/templates/mfa-reset'
import { renderTreasuryAlert } from '../lib/email/templates/treasury-alert'
import { renderLeaseEndingSoon } from '../lib/email/templates/lease-ending-soon'

const OUT_DIR = join(__dirname, '../../qa/screenshots/emails')
mkdirSync(OUT_DIR, { recursive: true })

async function main() {
  const previews: Array<{ name: string; html: Promise<string> }> = [
    {
      name: 'welcome',
      html: renderWelcome({
        fullName: 'Jane Doe',
        memberId: 'K-001234',
        role: 'RESIDENT',
        loginUrl: 'https://app.cityofkaris.com/sign-in',
      }),
    },
    {
      name: 'credentials',
      html: renderCredentials({
        fullName: 'John Smith',
        email: 'john@example.com',
        temporaryPassword: 'Temp#9876',
        loginUrl: 'https://app.cityofkaris.com/sign-in',
      }),
    },
    {
      name: 'password-reset',
      html: renderPasswordReset({
        fullName: 'Alice',
        resetUrl: 'https://app.cityofkaris.com/reset?token=abc',
        expiresInMinutes: 30,
      }),
    },
    {
      name: 'voucher-delivery',
      html: renderVoucherDelivery({
        recipientName: 'Bob',
        voucherCode: 'VOC-XYZ',
        amountKcrd: '500.00',
        description: 'Staff bonus',
        redeemUrl: 'https://app.cityofkaris.com/wallet',
      }),
    },
    {
      name: 'settlement-confirmation',
      html: renderSettlementConfirmation({
        recipientName: 'Carol',
        amountKcrd: '1000.00',
        status: 'approved',
        settlementId: 'sett-abc',
        historyUrl: 'https://app.cityofkaris.com/wallet/settlements',
      }),
    },
    {
      name: 'rental-extension-decision',
      html: renderRentalExtensionDecision({
        residentName: 'Eve',
        propertyCode: 'RESIDENCE-A12',
        decision: 'approved',
        newEndDate: '31 December 2026',
        leaseUrl: 'https://app.cityofkaris.com/property',
      }),
    },
    {
      name: 'emergency-broadcast-urgent',
      html: renderEmergencyBroadcast({
        recipientName: 'Grace',
        headline: 'Water supply interruption',
        message: 'The main water line will be shut off for maintenance from 08:00–12:00.',
        sentAt: '29 Apr 2026 06:00 UTC',
        severity: 'URGENT',
      }),
    },
    {
      name: 'emergency-broadcast-critical',
      html: renderEmergencyBroadcast({
        recipientName: 'Henry',
        headline: 'Evacuation required — Block C',
        message: 'All residents in Block C must evacuate immediately. Follow emergency signage.',
        sentAt: '29 Apr 2026 07:30 UTC',
        severity: 'CRITICAL',
      }),
    },
    {
      name: 'emergency-broadcast-info',
      html: renderEmergencyBroadcast({
        recipientName: 'Iris',
        headline: 'Community event this Saturday',
        message: 'Join us for the City of Karis founding celebration at the central plaza.',
        sentAt: '29 Apr 2026 09:00 UTC',
        severity: 'INFO',
      }),
    },
    {
      name: 'property-transfer-decision',
      html: renderPropertyTransferDecision({
        recipientName: 'James',
        propertyCode: 'KAR-042',
        propertyAddress: '42 Karis Crescent, Unit 3',
        decision: 'approved',
        requestId: 'req-001',
        dashboardUrl: 'https://app.cityofkaris.com/dashboard',
      }),
    },
    {
      name: 'mfa-reset',
      html: renderMfaReset({
        recipientName: 'Leo',
        resetByAdminName: 'Master Admin',
        resetAt: '29 Apr 2026 10:00 UTC',
        enrollUrl: 'https://app.cityofkaris.com/account/mfa-enroll',
      }),
    },
    {
      name: 'treasury-alert',
      html: renderTreasuryAlert({
        recipientName: 'Maria',
        discrepancy: '15.50',
        netSum: '-15.50',
        reportUrl: 'https://app.cityofkaris.com/admin/treasury/reconciliation/rpt-001',
        runAt: '29 Apr 2026 00:00 UTC',
      }),
    },
    {
      name: 'lease-ending-soon',
      html: renderLeaseEndingSoon({
        residentName: 'Nathan',
        propertyCode: 'KAR-007',
        endDate: '31 Dec 2026',
        daysUntilEnd: 14,
        propertyUrl: 'https://app.cityofkaris.com/property',
      }),
    },
  ]

  let count = 0
  for (const { name, html } of previews) {
    const rendered = await html
    const outPath = join(OUT_DIR, `${name}.html`)
    writeFileSync(outPath, rendered, 'utf-8')
    console.log(`  ✓  ${name}.html`)
    count++
  }

  console.log(`\nGenerated ${count} email previews → qa/screenshots/emails/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
