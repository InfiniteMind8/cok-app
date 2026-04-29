import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parsePropertiesSheet } from '../properties-parser'

function makeXlsx(rows: Record<string, unknown>[]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Properties')
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

const VALID_ROW = {
  external_ref: 'UNIT-001',
  address_line_1: '12 Karis Boulevard',
  address_line_2: 'Block A',
  lot_number: 'L-001',
  type: 'OWNERSHIP',
  size_sqm: '120.5',
  bedrooms: '3',
  bathrooms: '2',
  parking_spots: '1',
  year_built: '2022',
  status: 'VACANT',
  purchase_price_kcrd: '50000',
  current_valuation_kcrd: '55000',
  notes: 'Corner unit',
}

describe('parsePropertiesSheet', () => {
  it('returns VALID for a fully correct row', async () => {
    const buf = makeXlsx([VALID_ROW])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('VALID')
    expect(rows[0].messages).toHaveLength(0)
    expect(rows[0].rowData.address_line_1).toBe('12 Karis Boulevard')
    expect(rows[0].rowData.type).toBe('OWNERSHIP')
  })

  it('returns VALID with empty optional fields', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'RENTAL' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('VALID')
    expect(rows[0].rowData.size_sqm).toBe('')
    expect(rows[0].rowData.bedrooms).toBe('')
    expect(rows[0].rowData.status).toBe('VACANT') // default
  })

  it('returns ERROR when address_line_1 is missing', async () => {
    const buf = makeXlsx([{ type: 'OWNERSHIP' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('address_line_1'))).toBe(true)
  })

  it('returns ERROR when type is missing', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('type'))).toBe(true)
  })

  it('returns ERROR for invalid type value', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'FREEHOLD' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('type'))).toBe(true)
  })

  it('normalises type to uppercase', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'ownership' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('VALID')
    expect(rows[0].rowData.type).toBe('OWNERSHIP')
  })

  it('returns ERROR for invalid status value', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'RENTAL', status: 'AVAILABLE' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('status'))).toBe(true)
  })

  it('accepts valid status values', async () => {
    for (const s of ['VACANT', 'OCCUPIED', 'UNDER_CONSTRUCTION']) {
      const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'RENTAL', status: s }])
      const rows = await parsePropertiesSheet(buf, new Set())
      expect(rows[0].status).toBe('VALID')
      expect(rows[0].rowData.status).toBe(s)
    }
  })

  it('returns ERROR for negative size_sqm', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', size_sqm: '-10' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('size_sqm'))).toBe(true)
  })

  it('returns ERROR for non-numeric size_sqm', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', size_sqm: 'big' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
  })

  it('returns WARNING for decimal bedrooms (coerces to int)', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', bedrooms: '2.5' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('WARNING')
    expect(rows[0].rowData.bedrooms).toBe('2')
    expect(rows[0].messages.some((m) => m.includes('bedrooms'))).toBe(true)
  })

  it('returns ERROR for year_built below 1800', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', year_built: '1799' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('year_built'))).toBe(true)
  })

  it('returns ERROR for year_built above current year', async () => {
    const futureYear = new Date().getFullYear() + 1
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', year_built: String(futureYear) }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('year_built'))).toBe(true)
  })

  it('returns ERROR for negative purchase_price_kcrd', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', purchase_price_kcrd: '-1' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('purchase_price_kcrd'))).toBe(true)
  })

  it('returns ERROR for negative current_valuation_kcrd', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', current_valuation_kcrd: '-500' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('ERROR')
    expect(rows[0].messages.some((m) => m.includes('current_valuation_kcrd'))).toBe(true)
  })

  it('returns WARNING for duplicate external_ref within file', async () => {
    const row = { address_line_1: '5 Palm Drive', type: 'OWNERSHIP', external_ref: 'UNIT-001' }
    const buf = makeXlsx([row, row])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].status).toBe('VALID')
    expect(rows[1].status).toBe('WARNING')
    expect(rows[1].messages.some((m) => m.includes('UNIT-001'))).toBe(true)
  })

  it('returns WARNING when external_ref matches existing DB property code', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP', external_ref: 'RESIDENCE-A12' }])
    const rows = await parsePropertiesSheet(buf, new Set(['RESIDENCE-A12']))
    expect(rows[0].status).toBe('WARNING')
    expect(rows[0].messages.some((m) => m.includes('RESIDENCE-A12'))).toBe(true)
  })

  it('uses IMP-NNNN code for duplicate check when external_ref is absent', async () => {
    const buf = makeXlsx([{ address_line_1: '5 Palm Drive', type: 'OWNERSHIP' }])
    const rows = await parsePropertiesSheet(buf, new Set(['IMP-0001']))
    expect(rows[0].status).toBe('WARNING')
    expect(rows[0].messages.some((m) => m.includes('IMP-0001'))).toBe(true)
  })

  it('concatenates address_line_1 and address_line_2 in rowData (verified at commit, stored separately)', async () => {
    const buf = makeXlsx([{ address_line_1: '12 Karis Boulevard', address_line_2: 'Apt 3B', type: 'RENTAL' }])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows[0].rowData.address_line_1).toBe('12 Karis Boulevard')
    expect(rows[0].rowData.address_line_2).toBe('Apt 3B')
  })

  it('ERROR rows still carry ERROR status even when they also trigger WARNING conditions', async () => {
    const buf = makeXlsx([
      { type: 'OWNERSHIP', external_ref: 'UNIT-X' }, // missing address → ERROR; also a duplicate below
      { type: 'OWNERSHIP', address_line_1: '1 Palm', external_ref: 'UNIT-X' }, // duplicate ext ref → WARNING
    ])
    const existingCodes = new Set<string>()
    const rows = await parsePropertiesSheet(buf, existingCodes)
    expect(rows[0].status).toBe('ERROR') // missing address wins
    expect(rows[1].status).toBe('WARNING') // only warning: duplicate ext_ref
  })

  it('parses multiple rows and assigns correct rowNumber', async () => {
    const buf = makeXlsx([
      { address_line_1: 'A', type: 'OWNERSHIP' },
      { address_line_1: 'B', type: 'RENTAL' },
      { address_line_1: 'C', type: 'ADMIN' },
    ])
    const rows = await parsePropertiesSheet(buf, new Set())
    expect(rows).toHaveLength(3)
    expect(rows[0].rowNumber).toBe(2)
    expect(rows[1].rowNumber).toBe(3)
    expect(rows[2].rowNumber).toBe(4)
  })
})
