/**
 * TODO(phase1+/D.3): Playwright E2E tests for MFA enforcement.
 * These require @playwright/test, a running dev server, and Clerk test mode with TOTP support.
 * Install with: pnpm add -D @playwright/test
 *
 * Scenarios:
 * 1. MASTER_ADMIN without MFA enrolled → redirected to /account/mfa-enroll on any admin route.
 *    Cannot reach /admin/dashboard until enrollment is complete.
 * 2. MASTER_ADMIN with MFA enrolled → challenged for TOTP at sign-in, then accesses /admin/dashboard.
 * 3. Full enrollment flow: QR scan → verify code → backup codes → dashboard redirect.
 * 4. RESIDENT is not redirected — MFA is optional. /profile accessible, 2FA CTA visible.
 * 5. RESIDENT can navigate to /account/mfa-enroll via the 2FA CTA in Settings.
 */

import { describe, it } from 'vitest'

describe.skip('D.3 MFA enforcement — staff (requires live server + @playwright/test)', () => {
  it('MASTER_ADMIN without MFA is redirected to /account/mfa-enroll on admin route access', () => {
    // 1. Sign in as MASTER_ADMIN test account with no TOTP enrolled (Clerk test mode)
    // 2. Navigate to /admin/dashboard
    // 3. Assert URL is /account/mfa-enroll (redirected)
    // 4. Assert /admin/dashboard is inaccessible until enrollment completes
  })

  it('MASTER_ADMIN with MFA enrolled can reach /admin/dashboard', () => {
    // 1. Sign in as MASTER_ADMIN test account with TOTP enrolled
    // 2. Provide TOTP code via Clerk challenge
    // 3. Navigate to /admin/dashboard
    // 4. Assert URL is /admin/dashboard (no redirect)
  })

  it('enrollment flow: setup → QR scan → verify → backup codes → dashboard', () => {
    // 1. Sign in as MASTER_ADMIN with no MFA
    // 2. Assert redirect to /account/mfa-enroll
    // 3. Click "Get started" → assert QR code (svg element) is rendered
    // 4. Use Clerk test TOTP secret to generate valid code
    // 5. Enter code → assert backup codes panel appears (10 codes)
    // 6. Check "I have saved these backup codes" → click "Done"
    // 7. Assert redirect to /dashboard
    // 8. Assert subsequent admin route access does NOT redirect to /account/mfa-enroll
  })
})

describe.skip('D.3 MFA enforcement — resident (requires live server + @playwright/test)', () => {
  it('RESIDENT is not redirected on sign-in — /profile accessible without MFA', () => {
    // 1. Sign in as RESIDENT test account with no MFA
    // 2. Navigate to /profile
    // 3. Assert URL is /profile (no redirect)
    // 4. Assert "Two-factor authentication" link is visible in Settings section
  })

  it('RESIDENT can reach /account/mfa-enroll via 2FA CTA on /profile', () => {
    // 1. Sign in as RESIDENT, navigate to /profile
    // 2. Click "Two-factor authentication" link
    // 3. Assert URL is /account/mfa-enroll
    // 4. Assert page shows "Set up two-factor authentication"
  })
})
