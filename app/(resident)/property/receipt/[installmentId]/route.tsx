import { NextResponse } from 'next/server'
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { getCurrentUser } from '@/lib/auth'
import { residentPropertyApi, ApiClientError } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FDFCFB',
    padding: 48,
    fontSize: 11,
    color: '#3A3028',
  },
  header: {
    marginBottom: 28,
    borderBottom: '1 solid #EDE8E3',
    paddingBottom: 18,
  },
  wordmark: {
    fontSize: 22,
    letterSpacing: 1,
    color: '#1E2E23',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    color: '#8C7E72',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    color: '#1E2E23',
    marginBottom: 18,
    marginTop: 10,
  },
  amountBox: {
    backgroundColor: '#1E2E23',
    padding: 16,
    borderRadius: 4,
    marginBottom: 22,
    marginTop: 6,
  },
  amountLabel: {
    color: '#A8946A',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '0.5 solid #EDE8E3',
  },
  label: {
    color: '#8C7E72',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    color: '#3A3028',
    textAlign: 'right',
    maxWidth: '60%',
  },
  footer: {
    marginTop: 28,
    paddingTop: 14,
    borderTop: '1 solid #EDE8E3',
  },
  footerText: {
    fontSize: 8,
    color: '#8C7E72',
    textAlign: 'center',
  },
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ installmentId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return new NextResponse('Unauthorised', { status: 401 })

  const { installmentId } = await params

  let payment
  try {
    payment = await residentPropertyApi.getInstallmentPayment(getServerApi(), installmentId)
  } catch (err) {
    if (err instanceof ApiClientError) {
      return new NextResponse(err.message, { status: err.status })
    }
    throw err
  }

  const amount = Math.abs(parseFloat(payment.amount)).toFixed(2)
  const [int, dec] = amount.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formattedAmount = `K ${withCommas}.${dec}`

  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const dueDate = new Date(payment.installment.dueDate).toLocaleDateString('en-GB', dateOpts)
  const paidAt = new Date(payment.paidAt).toLocaleDateString('en-GB', dateOpts)

  const receipt = (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>City of Karis</Text>
          <Text style={styles.tagline}>Beautiful, Empowered Living in Guyana</Text>
        </View>

        <Text style={styles.title}>Installment Payment Receipt</Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Member</Text>
          <Text style={styles.value}>{payment.member.fullName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Member ID</Text>
          <Text style={styles.value}>{payment.member.memberId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.value}>{payment.property.code}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Installment</Text>
          <Text style={styles.value}>#{payment.installment.number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Due date</Text>
          <Text style={styles.value}>{dueDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Paid at</Text>
          <Text style={styles.value}>{paidAt}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {'This receipt confirms a property installment payment on the City of Karis platform.\nIssued by City of Karis Treasury.'}
          </Text>
        </View>
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(receipt)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="karis-installment-${payment.installment.number}-${payment.property.code}.pdf"`,
    },
  })
}
