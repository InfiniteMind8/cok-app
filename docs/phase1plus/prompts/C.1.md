# Prompt C.1 — Multi-currency display, conversion rates, and bonus promotions

**Block:** C — New functional requirements  
**Status:** In Progress (2026-04-28)

## Brief
Users must be able to view monetary values in K Credits, USD, or GYD per a personal preference. Master Admin must be able to set and edit conversion rates, and run conversion-bonus promotions. The K Credit ledger remains the only source of truth — currency switching is presentation; conversion is a ledger event.

## Acceptance Criteria
1. Master Admin can change a rate and the change is reflected immediately across the app.
2. A user with display preference USD sees every amount in USD with the KCRD tooltip; switching to GYD updates everything; KCRD shows raw.
3. A founding-member user converting USD → KCRD during a +20% active promotion receives base + 20% and sees two ledger entries.
4. A non-eligible user receives base only.
5. The ledger remains internally balanced after every conversion.

## Key Schema Additions
- `ConversionRate` model (append-only rate registry)
- `ConversionPromotion` model (bonus promotions)
- `DisplayCurrency` enum (KCRD, USD, GYD)
- `User.displayCurrency` (default KCRD)
- `User.foundingMember` (Boolean, default false)
- `TransactionType.FIAT_CONVERSION` + `CONVERSION_BONUS`

## New System Wallets
- `fiat_settlement` — debit side of FIAT_CONVERSION entries
- `promotions` — debit side of CONVERSION_BONUS entries

## New Routes
- `/admin/settings/currency` — rate editor
- `/admin/settings/promotions` — promotions manager

## Sacred Boundary
`formatAmount` → presentation only, never touches ledger.  
`convertFiatToKcrd` → ledger event, always two entries (base + optional bonus).
