import { DisplayCurrency } from '@/lib/prisma-shim'

// D.4: this module used to hit lib/db directly for active/historical rates.
// Frontend rate reads now go through `meApi.getActiveRates(api)` which hits
// `/v1/me/rates/active` on the backend. The types below stay as the shared
// shape for callers (components + API responses).

export type RatePair = {
  base: DisplayCurrency
  quote: DisplayCurrency
  rate: string
}

export type RateMap = Record<string, string>

export function rateKey(base: DisplayCurrency, quote: DisplayCurrency): string {
  return `${base}_${quote}`
}
