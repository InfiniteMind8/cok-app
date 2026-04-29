import { requireRole } from '@/lib/auth'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const DATA_COLUMNS = [
  'external_ref',
  'address_line_1',
  'address_line_2',
  'lot_number',
  'type',
  'size_sqm',
  'bedrooms',
  'bathrooms',
  'parking_spots',
  'year_built',
  'status',
  'purchase_price_kcrd',
  'current_valuation_kcrd',
  'notes',
]

const README_ROWS = [
  ['Column', 'Required', 'Format / Notes'],
  ['external_ref', 'No', 'Your own property ID (used as the system code and for zip matching)'],
  ['address_line_1', 'Yes', 'Primary address line'],
  ['address_line_2', 'No', 'Apartment, suite, block, etc.'],
  ['lot_number', 'No', 'Lot or parcel number'],
  ['type', 'Yes', 'OWNERSHIP · RENTAL · ADMIN'],
  ['size_sqm', 'No', 'Floor area in square metres (decimal, e.g. 120.5)'],
  ['bedrooms', 'No', 'Integer (e.g. 3)'],
  ['bathrooms', 'No', 'Integer (e.g. 2)'],
  ['parking_spots', 'No', 'Integer (e.g. 1)'],
  ['year_built', 'No', 'Four-digit year (1800–current year)'],
  ['status', 'No', 'VACANT · OCCUPIED · UNDER_CONSTRUCTION (default: VACANT)'],
  ['purchase_price_kcrd', 'No', 'Purchase price in KCRD (decimal, e.g. 50000)'],
  ['current_valuation_kcrd', 'No', 'Current valuation in KCRD (decimal)'],
  ['notes', 'No', 'Any additional notes for the admin'],
  [],
  ['Companion zip instructions', '', ''],
  ['Top-level folder names must match the external_ref column.', '', ''],
  ['Subfolders: photos/ · title-deed/ · occupancy-permit/ · utility/', '', ''],
  ['Example: UNIT-001/photos/front.jpg · UNIT-001/title-deed/deed.pdf', '', ''],
]

export async function GET() {
  await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const wb = XLSX.utils.book_new()

  const dataWs = XLSX.utils.aoa_to_sheet([DATA_COLUMNS])
  XLSX.utils.book_append_sheet(wb, dataWs, 'Properties')

  const readmeWs = XLSX.utils.aoa_to_sheet(README_ROWS)
  XLSX.utils.book_append_sheet(wb, readmeWs, 'Read me')

  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const body = new Uint8Array(buf)

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="properties-template.xlsx"',
    },
  })
}
