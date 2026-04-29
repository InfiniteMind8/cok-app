import { requireRole } from '@/lib/auth'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const DATA_COLUMNS = [
  'full_name',
  'preferred_name',
  'dob',
  'gender',
  'email',
  'phone_e164',
  'national_id_type',
  'national_id_number',
  'emergency_contact_name',
  'emergency_contact_phone',
  'household_size',
  'vehicle_plates',
  'notes',
]

const README_ROWS = [
  ['Column', 'Required', 'Format / Notes'],
  ['full_name', 'Yes', 'Full legal name'],
  ['preferred_name', 'No', 'Preferred or display name'],
  ['dob', 'No', 'Date of birth — YYYY-MM-DD, MM/DD/YYYY, or DD-MM-YYYY'],
  ['gender', 'Yes', 'MALE · FEMALE · OTHER · PREFER_NOT_TO_SAY'],
  ['email', 'Yes', 'Valid email address (must be unique)'],
  ['phone_e164', 'No', 'E.164 format preferred, e.g. +1 868 555 0100'],
  ['national_id_type', 'No', 'e.g. PASSPORT, NATIONAL_ID, DRIVERS_LICENSE'],
  ['national_id_number', 'No', 'ID number matching the type'],
  ['emergency_contact_name', 'No', 'Full name of emergency contact'],
  ['emergency_contact_phone', 'No', 'Phone number of emergency contact'],
  ['household_size', 'No', 'Integer — number of people in household'],
  ['vehicle_plates', 'No', 'Plate numbers, comma-separated if multiple (e.g. PBG 1234, PAA 5678)'],
  ['notes', 'No', 'Any additional notes for the admin'],
]

export async function GET() {
  await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const wb = XLSX.utils.book_new()

  // Data sheet — headers only
  const dataWs = XLSX.utils.aoa_to_sheet([DATA_COLUMNS])
  XLSX.utils.book_append_sheet(wb, dataWs, 'Members')

  // Read me sheet
  const readmeWs = XLSX.utils.aoa_to_sheet(README_ROWS)
  XLSX.utils.book_append_sheet(wb, readmeWs, 'Read me')

  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const body = new Uint8Array(buf)

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="members-template.xlsx"',
    },
  })
}
