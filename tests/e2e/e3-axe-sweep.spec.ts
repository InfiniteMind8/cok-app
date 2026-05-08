/**
 * E.3 Axe accessibility sweep — captures violations to qa/lighthouse/ as JSON evidence.
 * Run as a one-shot evidence-collection script; not a persistent regression suite.
 * Uses existing demo auth for authenticated pages.
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'fs'
import path from 'path'

const QA_DIR = path.resolve(__dirname, '../../../qa/lighthouse')
fs.mkdirSync(QA_DIR, { recursive: true })

function saveResults(page: string, results: { violations: unknown[]; passes: unknown[]; incomplete: unknown[] }) {
  const slug = page.replace(/\//g, '_').replace(/^_/, '') || 'root'
  const out = {
    page,
    timestamp: new Date().toISOString(),
    violationCount: results.violations.length,
    passCount: results.passes.length,
    incompleteCount: results.incomplete.length,
    violations: results.violations,
    incomplete: results.incomplete,
  }
  fs.writeFileSync(path.join(QA_DIR, `axe-${slug}.json`), JSON.stringify(out, null, 2))
  return out
}

/** Sign-in page — unauthenticated */
test('axe: sign-in page', async ({ page }) => {
  await page.goto('/sign-in')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()

  const out = saveResults('/sign-in', results)
  console.log(`/sign-in: ${out.violationCount} violations, ${out.passCount} passes, ${out.incompleteCount} incomplete`)

  // Critical or serious violations should not exist
  const criticalOrSerious = (results.violations as Array<{ impact: string; id: string; description: string }>).filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )
  expect(criticalOrSerious, `Critical/serious axe violations on /sign-in: ${JSON.stringify(criticalOrSerious.map((v) => ({ id: v.id, description: v.description })), null, 2)}`).toHaveLength(0)
})

/** Admin dashboard — requires MASTER_ADMIN demo auth */
test('axe: admin dashboard', async ({ page }) => {
  // Use demo shortcut if available
  await page.goto('/sign-in')
  await page.waitForLoadState('networkidle')

  const demoBtn = page.getByText('Master Admin').first()
  const hasDemoBtn = await demoBtn.isVisible().catch(() => false)

  if (!hasDemoBtn) {
    test.skip(true, 'Demo mode not enabled — skipping authenticated axe scan for /admin/dashboard')
    return
  }

  await demoBtn.click()
  await page.waitForURL('**/admin/**', { timeout: 10000 })

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .exclude('[data-radix-popper-content-wrapper]') // exclude floating portals from scan
    .analyze()

  const out = saveResults('/admin/dashboard', results)
  console.log(`/admin/dashboard: ${out.violationCount} violations, ${out.passCount} passes`)

  const criticalOrSerious = (results.violations as Array<{ impact: string; id: string; description: string }>).filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )
  expect(criticalOrSerious, `Critical/serious axe violations on /admin/dashboard`).toHaveLength(0)
})

/** Resident community — requires RESIDENT demo auth */
test('axe: resident community', async ({ page }) => {
  await page.goto('/sign-in')
  await page.waitForLoadState('networkidle')

  const demoBtn = page.getByText('Resident').first()
  const hasDemoBtn = await demoBtn.isVisible().catch(() => false)

  if (!hasDemoBtn) {
    test.skip(true, 'Demo mode not enabled — skipping /community axe scan')
    return
  }

  await demoBtn.click()
  await page.waitForURL('**/wallet**', { timeout: 10000 })
  await page.goto('/community')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()

  const out = saveResults('/community', results)
  console.log(`/community: ${out.violationCount} violations, ${out.passCount} passes`)

  const criticalOrSerious = (results.violations as Array<{ impact: string; id: string; description: string }>).filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )
  expect(criticalOrSerious, `Critical/serious axe violations on /community`).toHaveLength(0)
})

/** Admin approvals — modal-heavy */
test('axe: admin approvals', async ({ page }) => {
  await page.goto('/sign-in')
  await page.waitForLoadState('networkidle')

  const demoBtn = page.getByText('Master Admin').first()
  const hasDemoBtn = await demoBtn.isVisible().catch(() => false)

  if (!hasDemoBtn) {
    test.skip(true, 'Demo mode not enabled — skipping /admin/approvals axe scan')
    return
  }

  await demoBtn.click()
  await page.waitForURL('**/admin/**', { timeout: 10000 })
  await page.goto('/admin/approvals')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()

  const out = saveResults('/admin/approvals', results)
  console.log(`/admin/approvals: ${out.violationCount} violations, ${out.passCount} passes`)

  const criticalOrSerious = (results.violations as Array<{ impact: string; id: string; description: string }>).filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )
  expect(criticalOrSerious, `Critical/serious axe violations on /admin/approvals`).toHaveLength(0)
})

/** Resident wallet */
test('axe: resident wallet', async ({ page }) => {
  await page.goto('/sign-in')
  await page.waitForLoadState('networkidle')

  const demoBtn = page.getByText('Resident').first()
  const hasDemoBtn = await demoBtn.isVisible().catch(() => false)

  if (!hasDemoBtn) {
    test.skip(true, 'Demo mode not enabled — skipping /wallet axe scan')
    return
  }

  await demoBtn.click()
  await page.waitForURL('**/wallet**', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()

  const out = saveResults('/wallet', results)
  console.log(`/wallet: ${out.violationCount} violations, ${out.passCount} passes`)

  const criticalOrSerious = (results.violations as Array<{ impact: string; id: string; description: string }>).filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )
  expect(criticalOrSerious, `Critical/serious axe violations on /wallet`).toHaveLength(0)
})
