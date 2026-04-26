import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { renderInstallmentReceiptPdf } from '@/lib/pdf/installment-receipt'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ installmentId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return new NextResponse('Unauthorised', { status: 401 })

  const { installmentId } = await params

  const payment = await db.propertyPayment.findFirst({
    where: {
      installmentId,
      ownership: { userId: user.id },
    },
    include: {
      installment: {
        include: { property: true },
      },
      ownership: {
        include: { user: true },
      },
    },
  })

  if (!payment) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { installment } = payment
  const { property } = installment
  const member = payment.ownership.user

  const amount = Math.abs(parseFloat(payment.amount.toString())).toFixed(2)
  const [int, dec] = amount.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formattedAmount = `K ${withCommas}.${dec}`

  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const dueDate = new Date(installment.dueDate).toLocaleDateString('en-GB', dateOpts)
  const paidAt = new Date(payment.paidAt).toLocaleDateString('en-GB', dateOpts)

  const buffer = await renderInstallmentReceiptPdf({
    installmentNumber: installment.number,
    propertyCode: property.code,
    amount: formattedAmount,
    dueDate,
    paidAt,
    memberName: member.fullName,
    memberId: member.memberId,
    treasuryAdmin: 'City of Karis Treasury',
  })

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="karis-installment-${installment.number}-${property.code}.pdf"`,
    },
  })
}
