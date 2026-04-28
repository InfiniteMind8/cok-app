import type { RateMap } from './rate-resolver'

export type DisplayCurrencyCode = 'KCRD' | 'USD' | 'GYD'

const CURRENCY_SYMBOLS: Record<DisplayCurrencyCode, string> = {
  KCRD: 'K',
  USD: '$',
  GYD: 'G$',
}

const CURRENCY_DECIMALS: Record<DisplayCurrencyCode, number> = {
  KCRD: 2,
  USD: 2,
  GYD: 0,
}

function addCommas(str: string): string {
  const [int, dec] = str.split('.')
  const intWithCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${intWithCommas}.${dec}` : intWithCommas
}

export type FormattedAmount = {
  display: string       // e.g. "$ 1,000.00" or "K 1,000.00"
  symbol: string        // e.g. "$" or "K"
  value: string         // numeric string e.g. "1000.00"
  kcrdEquivalent: string // always the raw KCRD amount e.g. "1,000.00"
  tooltipText: string   // e.g. "≈ 1,000.00 KCRD @ 1 KCRD = 1.00 USD"
  isSameAsKcrd: boolean
}

export function formatAmount(
  kcrdAmount: string | number,
  toCurrency: DisplayCurrencyCode,
  rates: RateMap
): FormattedAmount {
  const kcrd = parseFloat(String(kcrdAmount))
  if (isNaN(kcrd)) {
    return {
      display: 'K 0.00',
      symbol: 'K',
      value: '0.00',
      kcrdEquivalent: '0.00',
      tooltipText: '≈ 0.00 KCRD',
      isSameAsKcrd: toCurrency === 'KCRD',
    }
  }

  const kcrdFormatted = addCommas(kcrd.toFixed(2))

  if (toCurrency === 'KCRD') {
    return {
      display: `K ${kcrdFormatted}`,
      symbol: 'K',
      value: kcrd.toFixed(2),
      kcrdEquivalent: kcrdFormatted,
      tooltipText: `${kcrdFormatted} KCRD`,
      isSameAsKcrd: true,
    }
  }

  const rateStr = rates[`KCRD_${toCurrency}`]
  if (!rateStr) {
    // Fall back to raw KCRD if rate unavailable
    return {
      display: `K ${kcrdFormatted}`,
      symbol: 'K',
      value: kcrd.toFixed(2),
      kcrdEquivalent: kcrdFormatted,
      tooltipText: `Rate unavailable — showing KCRD`,
      isSameAsKcrd: true,
    }
  }

  const rate = parseFloat(rateStr)
  const converted = kcrd * rate
  const decimals = CURRENCY_DECIMALS[toCurrency]
  const valueStr = converted.toFixed(decimals)
  const symbol = CURRENCY_SYMBOLS[toCurrency]
  const display = `${symbol} ${addCommas(valueStr)}`
  const rateDisplay = `1 KCRD = ${rate.toFixed(2)} ${toCurrency}`

  return {
    display,
    symbol,
    value: valueStr,
    kcrdEquivalent: kcrdFormatted,
    tooltipText: `≈ ${kcrdFormatted} KCRD @ ${rateDisplay}`,
    isSameAsKcrd: false,
  }
}
