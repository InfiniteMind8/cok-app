/**
 * Playwright global setup — runs once before all E2E tests.
 *
 * 1. Ensures the DB schema is current via `prisma migrate deploy`.
 * 2. Runs the standard seed so demo users, wallets, properties, votes exist.
 * 3. Seeds test-specific fixtures (pending approvals) used by individual specs.
 */
import { execSync } from 'child_process'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as XLSX from 'xlsx'
import fs from 'fs'

const ROOT = path.resolve(__dirname, '../..')

function run(cmd: string) {
  console.log(`[global-setup] ${cmd}`)
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
}

function db() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

async function seedTestFixtures(prisma: PrismaClient) {
  // ── Pending settlement request (Devon) ─────────────────────────────────────
  const devon = await prisma.user.findFirst({ where: { email: 'devon@example.com' } })
  if (devon) {
    const existing = await prisma.settlementRequest.findFirst({
      where: { userId: devon.id, status: 'PENDING_APPROVAL' },
    })
    if (!existing) {
      await prisma.settlementRequest.create({
        data: {
          userId: devon.id,
          amount: 250,
          purpose: 'E2E test settlement — D.10 fixture',
          status: 'PENDING_APPROVAL',
        },
      })
      console.log('[global-setup] Seeded pending settlement request for Devon')
    }
  }

  // ── Pending property transfer request (RESIDENCE-A12: Devon → Aaliyah) ─────
  const aaliyah = await prisma.user.findFirst({ where: { email: 'aaliyah@example.com' } })
  const propA12 = await prisma.property.findFirst({ where: { code: 'RESIDENCE-A12' } })
  if (devon && aaliyah && propA12) {
    const existing = await prisma.propertyTransferRequest.findFirst({
      where: { propertyId: propA12.id, status: 'PENDING' },
    })
    if (!existing) {
      await prisma.propertyTransferRequest.create({
        data: {
          propertyId: propA12.id,
          fromUserId: devon.id,
          toUserId: aaliyah.id,
          status: 'PENDING',
          message: 'E2E test transfer — D.10 fixture',
        },
      })
      console.log('[global-setup] Seeded pending property transfer request')
    }
  }

  // ── Pending voucher request (Aaliyah requests K 100) ───────────────────────
  if (aaliyah) {
    const existing = await prisma.voucherRequest.findFirst({
      where: { recipientId: aaliyah.id, status: 'PENDING' },
    })
    if (!existing) {
      await prisma.voucherRequest.create({
        data: {
          recipientId: aaliyah.id,
          amountKcrd: 100,
          message: 'E2E test voucher — D.10 fixture',
          status: 'PENDING',
        },
      })
      console.log('[global-setup] Seeded pending voucher request for Aaliyah')
    }
  }
}

function createMemberFixture() {
  const fixtureDir = path.join(ROOT, 'tests/e2e/fixtures')
  const fixturePath = path.join(fixtureDir, 'members-5row.xlsx')

  if (fs.existsSync(fixturePath)) return

  fs.mkdirSync(fixtureDir, { recursive: true })

  const rows = [
    ['full_name', 'email', 'phone', 'role', 'status'],
    ['Alice Import', 'alice.import@e2e.test', '+1-868-555-0001', 'RESIDENT', 'ACTIVE'],
    ['Bob Import', 'bob.import@e2e.test', '+1-868-555-0002', 'RESIDENT', 'ACTIVE'],
    ['Carol Import', 'carol.import@e2e.test', '+1-868-555-0003', 'VISITOR', 'PENDING_KYC'],
    ['David Import', 'david.import@e2e.test', '+1-868-555-0004', 'RESIDENT', 'ACTIVE'],
    ['Eve Import', 'eve.import@e2e.test', '+1-868-555-0005', 'VENDOR', 'ACTIVE'],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Members')
  XLSX.writeFile(wb, fixturePath)
  console.log('[global-setup] Created members-5row.xlsx fixture')
}

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    console.warn('[global-setup] DATABASE_URL not set — skipping DB setup')
    return
  }

  // 1. Apply any pending migrations
  try {
    run('pnpm prisma migrate deploy')
  } catch {
    console.warn('[global-setup] migrate deploy failed — DB may already be current')
  }

  // 2. Run main seed (idempotent upserts)
  try {
    run('node --env-file=.env --import tsx lib/seed/seed.ts')
  } catch {
    console.warn('[global-setup] Seed script failed — continuing with existing data')
  }

  // 3. Seed test fixtures via Prisma client
  const prisma = db()
  try {
    await seedTestFixtures(prisma)
  } finally {
    await prisma.$disconnect()
  }

  // 4. Create xlsx fixture file
  createMemberFixture()

  console.log('[global-setup] Complete')
}
