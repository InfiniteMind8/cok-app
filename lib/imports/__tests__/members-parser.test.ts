import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseMembersSheet, normalizeDate, normalizePhone } from '../members-parser'

function makeSheet(rows: Record<string, unknown>[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Members')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return buf as ArrayBuffer
}

// ─── normalizeDate ────────────────────────────────────────────────────────────

describe('normalizeDate', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(normalizeDate('1990-06-15')).toBe('1990-06-15')
  })

  it('accepts MM/DD/YYYY', () => {
    expect(normalizeDate('06/15/1990')).toBe('1990-06-15')
  })

  it('accepts DD-MM-YYYY', () => {
    expect(normalizeDate('15-06-1990')).toBe('1990-06-15')
  })

  it('returns null for empty string', () => {
    expect(normalizeDate('')).toBeNull()
  })

  it('returns null for unrecognized format', () => {
    expect(normalizeDate('15 June 1990')).toBeNull()
  })

  it('returns null for completely invalid string', () => {
    expect(normalizeDate('not-a-date')).toBeNull()
  })
})

// ─── normalizePhone ───────────────────────────────────────────────────────────

describe('normalizePhone', () => {
  it('accepts E.164 with country code', () => {
    const result = normalizePhone('+18685550100')
    expect(result).toEqual({ phone: '+18685550100', isWarning: false })
  })

  it('accepts E.164 with spaces/dashes stripped', () => {
    const result = normalizePhone('+1 (868) 555-0100')
    expect(result).toEqual({ phone: '+18685550100', isWarning: false })
  })

  it('normalizes 10-digit number with WARNING (no country code)', () => {
    const result = normalizePhone('8685550100')
    expect(result).toEqual({ phone: '+18685550100', isWarning: true })
  })

  it('normalizes 11-digit number starting with 1', () => {
    const result = normalizePhone('18685550100')
    expect(result).toEqual({ phone: '+18685550100', isWarning: false })
  })

  it('returns null for empty string', () => {
    expect(normalizePhone('')).toBeNull()
  })

  it('returns null for invalid format', () => {
    expect(normalizePhone('123')).toBeNull()
  })
})

// ─── parseMembersSheet ────────────────────────────────────────────────────────

const validRow = {
  full_name: '  Alice Doe  ',
  preferred_name: 'Ali',
  dob: '1990-06-15',
  gender: 'FEMALE',
  email: 'ALICE@EXAMPLE.COM',
  phone_e164: '+18685550100',
  national_id_type: 'PASSPORT',
  national_id_number: 'P123456',
  emergency_contact_name: 'Bob Doe',
  emergency_contact_phone: '+18685550200',
  household_size: '2',
  vehicle_plates: 'PBG 1234',
  notes: 'Founding member',
}

describe('parseMembersSheet', () => {
  it('marks a fully valid row as VALID', async () => {
    const buf = makeSheet([validRow])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('VALID')
    expect(rows[0].messages).toHaveLength(0)
  })

  it('trims whitespace from full_name', async () => {
    const buf = makeSheet([validRow])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].rowData.full_name).toBe('Alice Doe')
  })

  it('lowercases email', async () => {
    const buf = makeSheet([validRow])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].rowData.email).toBe('alice@example.com')
  })

  it('marks row with missing full_name as ERROR', async () => {
    const row = { ...validRow, full_name: '' }
    const buf = makeSheet([row])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('full_name'))).toBe(true)
  })

  it('marks row with invalid email as ERROR', async () => {
    const row = { ...validRow, email: 'not-an-email' }
    const buf = makeSheet([row])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.toLowerCase().includes('email'))).toBe(true)
  })

  it('marks row with invalid gender as ERROR', async () => {
    const row = { ...validRow, gender: 'UNKNOWN' }
    const buf = makeSheet([row])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.toLowerCase().includes('gender'))).toBe(true)
  })

  it('marks row with unrecognized date format as ERROR', async () => {
    const row = { ...validRow, dob: 'not-a-date' }
    const buf = makeSheet([row])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('dob'))).toBe(true)
  })

  it('marks row with phone missing country code as WARNING', async () => {
    const row = { ...validRow, phone_e164: '8685550100' }
    const buf = makeSheet([row])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].status).toBe('WARNING')
    expect(rows[0].rowData.phone_e164).toBe('+18685550100')
  })

  it('marks row with duplicate email as WARNING', async () => {
    const buf = makeSheet([validRow])
    const rows = await parseMembersSheet(buf, new Set(['alice@example.com']))
    expect(rows[0].status).toBe('WARNING')
    expect(rows[0].messages.some((m) => m.includes('already exists'))).toBe(true)
  })

  it('handles empty optional cells gracefully', async () => {
    const row = {
      ...validRow,
      preferred_name: '',
      national_id_type: '',
      notes: '',
      vehicle_plates: '',
      household_size: '',
    }
    const buf = makeSheet([row])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].status).toBe('VALID')
  })

  it('returns correct rowNumber (1-indexed, offset by header)', async () => {
    const buf = makeSheet([validRow, validRow])
    const rows = await parseMembersSheet(buf, new Set())
    expect(rows[0].rowNumber).toBe(2)
    expect(rows[1].rowNumber).toBe(3)
  })
})
