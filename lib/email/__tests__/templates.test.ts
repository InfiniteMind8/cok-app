import { describe, it, expect } from 'vitest'
import { renderWelcome } from '../templates/welcome'
import { renderCredentials } from '../templates/credentials'
import { renderPasswordReset } from '../templates/password-reset'
import { renderVoucherDelivery } from '../templates/voucher-delivery'
import { renderSettlementConfirmation } from '../templates/settlement-confirmation'
import { renderRentalExtensionDecision } from '../templates/rental-extension-decision'
import { renderEmergencyBroadcast } from '../templates/emergency-broadcast'
import { renderPropertyTransferDecision } from '../templates/property-transfer-decision'
import { renderMfaReset } from '../templates/mfa-reset'
import { renderTreasuryAlert } from '../templates/treasury-alert'
import { renderLeaseEndingSoon } from '../templates/lease-ending-soon'

describe('email templates', () => {
  it('welcome — renders without throwing and contains member ID', async () => {
    const html = await renderWelcome({
      fullName: 'Jane Doe',
      memberId: 'K-001234',
      role: 'RESIDENT',
      loginUrl: 'https://app.cityofkaris.com/sign-in',
    })
    expect(html).toContain('K-001234')
    expect(html).toContain('Jane Doe')
    expect(html).toContain('City of Karis')
  })

  it('credentials — renders email and temporary password', async () => {
    const html = await renderCredentials({
      fullName: 'John Smith',
      email: 'john@example.com',
      temporaryPassword: 'Temp#9876',
      loginUrl: 'https://app.cityofkaris.com/sign-in',
    })
    expect(html).toContain('john@example.com')
    expect(html).toContain('Temp#9876')
  })

  it('password-reset — renders reset URL and expiry', async () => {
    const html = await renderPasswordReset({
      fullName: 'Alice',
      resetUrl: 'https://app.cityofkaris.com/reset?token=abc',
      expiresInMinutes: 30,
    })
    expect(html).toContain('30')
    expect(html).toContain('reset')
  })

  it('voucher-delivery — renders amount and code', async () => {
    const html = await renderVoucherDelivery({
      recipientName: 'Bob',
      voucherCode: 'VOC-XYZ',
      amountKcrd: '500.00',
      description: 'Staff bonus',
      redeemUrl: 'https://app.cityofkaris.com/wallet',
    })
    expect(html).toContain('500.00')
    expect(html).toContain('VOC-XYZ')
  })

  it('settlement-confirmation — approved path', async () => {
    const html = await renderSettlementConfirmation({
      recipientName: 'Carol',
      amountKcrd: '1000.00',
      status: 'approved',
      settlementId: 'sett-abc',
      historyUrl: 'https://app.cityofkaris.com/wallet/settlements',
    })
    expect(html).toContain('Approved')
    expect(html).toContain('1000.00')
  })

  it('settlement-confirmation — declined path includes reason', async () => {
    const html = await renderSettlementConfirmation({
      recipientName: 'Dave',
      amountKcrd: '200.00',
      status: 'declined',
      declineReason: 'Insufficient documentation',
      settlementId: 'sett-def',
      historyUrl: 'https://app.cityofkaris.com/wallet/settlements',
    })
    expect(html).toContain('Declined')
    expect(html).toContain('Insufficient documentation')
  })

  it('rental-extension-decision — approved path shows new end date', async () => {
    const html = await renderRentalExtensionDecision({
      residentName: 'Eve',
      propertyCode: 'RESIDENCE-A12',
      decision: 'approved',
      newEndDate: '31 December 2026',
      leaseUrl: 'https://app.cityofkaris.com/property',
    })
    expect(html).toContain('approved')
    expect(html).toContain('31 December 2026')
  })

  it('rental-extension-decision — declined path shows note', async () => {
    const html = await renderRentalExtensionDecision({
      residentName: 'Frank',
      propertyCode: 'RESIDENCE-B3',
      decision: 'declined',
      decisionNote: 'Unit required for incoming resident',
      leaseUrl: 'https://app.cityofkaris.com/property',
    })
    expect(html).toContain('declined')
    expect(html).toContain('Unit required for incoming resident')
  })

  it('emergency-broadcast — renders headline and message (default URGENT severity)', async () => {
    const html = await renderEmergencyBroadcast({
      recipientName: 'Grace',
      headline: 'Water supply interruption',
      message: 'The main water line will be shut off for maintenance.',
      sentAt: '28 Apr 2026 06:00',
    })
    expect(html).toContain('Water supply interruption')
    expect(html).toContain('Urgent Notice')
    expect(html).toContain('Grace')
  })

  it('emergency-broadcast — CRITICAL severity renders critical label', async () => {
    const html = await renderEmergencyBroadcast({
      recipientName: 'Henry',
      headline: 'Evacuation required',
      message: 'All residents must evacuate immediately.',
      sentAt: '28 Apr 2026 08:00',
      severity: 'CRITICAL',
    })
    expect(html).toContain('Critical Alert')
    expect(html).toContain('Evacuation required')
  })

  it('emergency-broadcast — INFO severity renders community notice label', async () => {
    const html = await renderEmergencyBroadcast({
      recipientName: 'Iris',
      headline: 'Parking reminder',
      message: 'Please observe parking restrictions this weekend.',
      sentAt: '28 Apr 2026 09:00',
      severity: 'INFO',
    })
    expect(html).toContain('Community Notice')
    expect(html).toContain('Parking reminder')
  })

  it('property-transfer-decision — approved path', async () => {
    const html = await renderPropertyTransferDecision({
      recipientName: 'James',
      propertyCode: 'KAR-042',
      decision: 'approved',
      requestId: 'req-001',
      dashboardUrl: 'https://app.cityofkaris.com/dashboard',
    })
    expect(html).toContain('approved')
    expect(html).toContain('KAR-042')
  })

  it('property-transfer-decision — declined path includes reason', async () => {
    const html = await renderPropertyTransferDecision({
      recipientName: 'Karen',
      propertyCode: 'KAR-099',
      decision: 'declined',
      declineReason: 'Pending legal review',
      requestId: 'req-002',
      dashboardUrl: 'https://app.cityofkaris.com/dashboard',
    })
    expect(html).toContain('declined')
    expect(html).toContain('Pending legal review')
    expect(html).toContain('KAR-099')
  })

  it('mfa-reset — renders admin name and enrol URL', async () => {
    const html = await renderMfaReset({
      recipientName: 'Leo',
      resetByAdminName: 'Master Admin',
      resetAt: '29 Apr 2026 10:00 UTC',
      enrollUrl: 'https://app.cityofkaris.com/account/mfa-enroll',
    })
    expect(html).toContain('Master Admin')
    expect(html).toContain('mfa-enroll')
    expect(html).toContain('Leo')
  })

  it('treasury-alert — renders discrepancy and report link', async () => {
    const html = await renderTreasuryAlert({
      recipientName: 'Maria',
      discrepancy: '15.50',
      netSum: '-15.50',
      reportUrl: 'https://app.cityofkaris.com/admin/treasury/reconciliation/rpt-001',
      runAt: '29 Apr 2026 00:00 UTC',
    })
    expect(html).toContain('15.50')
    expect(html).toContain('reconciliation')
    expect(html).toContain('Maria')
  })

  it('lease-ending-soon — renders property code, end date, and days remaining', async () => {
    const html = await renderLeaseEndingSoon({
      residentName: 'Nathan',
      propertyCode: 'KAR-007',
      endDate: '31 Dec 2026',
      daysUntilEnd: 14,
      propertyUrl: 'https://app.cityofkaris.com/property',
    })
    expect(html).toContain('Nathan')
    expect(html).toContain('KAR-007')
    expect(html).toContain('31 Dec 2026')
    expect(html).toContain('14')
  })
})
