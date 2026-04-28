# Currency & Promotions System

## Overview

The ledger is always denominated in **K Credits (KCRD)**. Currency is a presentation and on-ramp/off-ramp concern only. This separation is the sacred boundary: `formatAmount` is display-only and never writes to the ledger; `convertFiatToKcrd` is the only path that moves money.

---

## Models

### `ConversionRate`

Append-only rate registry. Each pair row has an `effectiveFrom` and optional `effectiveTo`. When a new rate is set for a pair, the prior row's `effectiveTo` is updated atomically in the same transaction.

| Field | Type | Notes |
|---|---|---|
| `baseCurrency` | `DisplayCurrency` | KCRD, USD, or GYD |
| `quoteCurrency` | `DisplayCurrency` | KCRD, USD, or GYD |
| `rate` | `Decimal(18,8)` | 1 base = rate quote |
| `effectiveFrom` | `DateTime` | Cannot be backdated >60s |
| `effectiveTo` | `DateTime?` | null = currently active |
| `setBy` | `String` | userId of admin who set it |

All 6 directional pairs are managed: KCRD↔USD, KCRD↔GYD, USD↔GYD.

### `ConversionPromotion`

Bonus K Credit incentives applied during on-ramp (Fiat→KCRD) or off-ramp (KCRD→Fiat) conversions.

| Field | Type | Notes |
|---|---|---|
| `bonusPercent` | `Decimal(5,2)` | Percentage of base conversion amount |
| `direction` | `PromotionDirection` | FIAT_TO_KCRD or KCRD_TO_FIAT |
| `eligibility` | `PromotionEligibility` | ALL, FOUNDING_MEMBERS, RESIDENTS_ONLY, SPECIFIC_USERS |
| `eligibleUserIds` | `String[]` | Used when eligibility = SPECIFIC_USERS |
| `active` | `Boolean` | false = archived |
| `startsAt` / `endsAt` | `DateTime` | Promotion window |

---

## Display Layer

### `formatAmount(kcrdAmount, toCurrency, rates): FormattedAmount`

Pure function, client-safe. Takes a KCRD amount, target display currency, and a pre-fetched `RateMap`. Returns `{ display, symbol, value, kcrdEquivalent, tooltipText, isSameAsKcrd }`.

- Falls back to KCRD display if rate unavailable.
- GYD uses 0 decimal places; USD/KCRD use 2.
- Never touches the database.

### `getCurrentRates(): Promise<RateMap>`

Server-only. Returns all active rates as a `Record<string, string>` keyed by `"BASE_QUOTE"` (e.g. `"KCRD_USD"`). Identity pairs (`KCRD_KCRD`, etc.) are always included as `'1'`.

Call once in a server component and pass the `RateMap` as props to client components.

### `KAmount` component

Accepts optional `displayCurrency` and `rates` props. When provided and currency ≠ KCRD, renders the converted amount with a KCRD tooltip via `formatAmount`. Falls back to KCRD rendering when props are absent (backwards compatible).

---

## User Preference

`User.displayCurrency` (enum: `KCRD | USD | GYD`, default `KCRD`) stores the user's chosen display currency. Updated via `updateDisplayCurrencyAction` (profile settings). This write touches only `User.displayCurrency` — no ledger event is emitted.

---

## Conversion Engine

`convertFiatToKcrd({ userId, fiatAmount, fiatCurrency, recordedBy })` is the only path that moves money. It:

1. Resolves the current rate for `fiatCurrency → KCRD`
2. Resolves the applicable promotion for the user
3. Posts a `FIAT_CONVERSION` ledger entry: `fiat_settlement` wallet → user wallet (base amount)
4. If a promotion applies, posts a `CONVERSION_BONUS` entry: `promotions` wallet → user wallet (bonus amount)
5. Writes an audit log entry
6. Returns `{ ok, baseKcrd, bonusKcrd, totalKcrd, promotionId, promotionName }`

Both ledger entries are posted in a single `db.$transaction`.

---

## Admin UI

- `/admin/settings/currency` — Rate editor: current rate per pair, inline input for new rate, rate history table
- `/admin/settings/promotions` — Promotion manager: active / scheduled / expired groups, create new promotion modal, archive button

---

## System Wallets

Two system wallets support the conversion flow (idempotent-seeded):

| Key | Purpose |
|---|---|
| `fiat_settlement` | Debit side of FIAT_CONVERSION entries (represents off-chain fiat receipt) |
| `promotions` | Debit side of CONVERSION_BONUS entries (bonus credit source) |
