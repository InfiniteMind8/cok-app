import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { residentWalletApi, ApiClientError } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FDFCFB',
    padding: 48,
    fontSize: 11,
    color: '#3A3028',
  },
  header: {
    marginBottom: 32,
    borderBottom: '1 solid #EDE8E3',
    paddingBottom: 20,
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
    fontSize: 18,
    color: '#1E2E23',
    marginBottom: 20,
    marginTop: 12,
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
  amountBox: {
    backgroundColor: '#1E2E23',
    padding: 16,
    borderRadius: 4,
    marginBottom: 24,
    marginTop: 8,
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
  footer: {
    marginTop: 32,
    paddingTop: 16,
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
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return new NextResponse('Unauthorised', { status: 401 })

  const { transactionId } = await params

  let transaction
  try {
    transaction = await residentWalletApi.getTransaction(getServerApi(), transactionId)
  } catch (err) {
    if (err instanceof ApiClientError) {
      return new NextResponse(err.message, { status: err.status })
    }
    throw err
  }

  const amount = Math.abs(parseFloat(transaction.entryAmount)).toFixed(2)
  const [int, dec] = amount.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formattedAmount = `K ${withCommas}.${dec}`

  const txDate = new Date(transaction.createdAt)
  const dateStr =
    txDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) +
    ' ' +
    txDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const receipt = (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>City of Karis</Text>
          <Text style={styles.tagline}>Beautiful, Empowered Living in Guyana</Text>
        </View>

        <Text style={styles.title}>Transaction Receipt</Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Member</Text>
          <Text style={styles.value}>{user.fullName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Member ID</Text>
          <Text style={styles.value}>{user.memberId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{dateStr}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{transaction.type.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{transaction.description}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Reference</Text>
          <Text style={styles.value}>{transaction.reference ?? transaction.id}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {'This receipt confirms a K Credit transaction on the City of Karis platform.\nK Credits are backed 1:1 by Treasury reserves.'}
          </Text>
        </View>
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(receipt)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="karis-receipt-${transaction.id.slice(0, 8)}.pdf"`,
    },
  })
}
