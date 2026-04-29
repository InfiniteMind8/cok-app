# Observability — Sentry Setup & Alert Rules

## Overview

The City of Karis Community App uses [Sentry](https://sentry.io) for error monitoring on both the Next.js client (browser) and server (Node.js + edge runtime). Errors flow to Sentry with environment, release, and anonymized role tags. PII is never sent.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `SENTRY_DSN` | Server | DSN for server-side SDK init |
| `NEXT_PUBLIC_SENTRY_DSN` | Client (public) | DSN for client-side SDK init |
| `DEPLOY_ENV` | Server | `development` / `staging` / `production` |
| `NEXT_PUBLIC_DEPLOY_ENV` | Client (public) | Same, exposed to browser |
| `SENTRY_RELEASE` | Server | Git SHA or semver (set in CI) |
| `NEXT_PUBLIC_SENTRY_RELEASE` | Client | Same, exposed to browser |
| `SENTRY_AUTH_TOKEN` | CI only | Source map upload token — not needed at runtime |
| `SENTRY_ORG` | CI only | Org slug for `withSentryConfig` |
| `SENTRY_PROJECT` | CI only | Project slug for `withSentryConfig` |

Set `DEPLOY_ENV=production` in the Vercel/production environment config.

---

## First-Time Setup (Dr. Munroe)

1. Create a Sentry account at [sentry.io](https://sentry.io) and create a new project → **Next.js**.
2. Copy the **DSN** from Project Settings → Client Keys. Set both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to this value.
3. For source map upload in CI, create an auth token at Settings → Auth Tokens with scopes `project:releases` and `org:read`. Set `SENTRY_AUTH_TOKEN` in your CI environment (Vercel, GitHub Actions, etc.).
4. Set `DEPLOY_ENV=production` and `SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA` in the production environment.
5. Run `pnpm approve-builds` in the project root to allow `@sentry/cli` to run install scripts (required for source map upload).

---

## Recommended Alert Rules (configure in Sentry UI)

### 1. High error rate — immediate page

| Field | Value |
|---|---|
| Name | High error rate |
| Environment | `production` |
| Conditions | Error count `>` 10 in 1 minute |
| Action | Email → Dr. Munroe + Amani Saif |
| Priority | Critical |

### 2. New issue discovered

| Field | Value |
|---|---|
| Name | New issue |
| Environment | `production` |
| Conditions | A new issue is created |
| Action | Email → build agent / tech lead |
| Priority | High |

### 3. Server action failures

| Field | Value |
|---|---|
| Name | Server action error spike |
| Environment | `production` |
| Conditions | Events with tag `context = server_action` > 5 in 5 minutes |
| Action | Email → Dr. Munroe |
| Priority | High |

### 4. MFA or auth failures

| Field | Value |
|---|---|
| Name | Auth error spike |
| Environment | `production` |
| Conditions | Events with tag `context = admin_route` > 3 in 10 minutes |
| Action | Email → Dr. Munroe |
| Priority | Critical |

---

## PII Policy

Sentry is configured to strip all PII before sending:
- `event.user` is reduced to `{ role: "MASTER_ADMIN" }` — no email, no name, no ID
- Request body fields `email`, `name`, `phone`, `storageKey`, `nationalIdNumber` are replaced with `[Filtered]`
- Session replays (client-side) mask all text and block all media

Never disable `beforeSend` or remove the field scrubbing without a security review.

---

## Verifying the Integration

```
# In development: trigger a test event as MASTER_ADMIN
curl -b '<your-clerk-session-cookie>' http://localhost:3000/api/sentry-test
```

Expected Sentry event:
- `environment`: `development`
- `release`: `dev` (or git SHA in CI)
- `user.role`: `MASTER_ADMIN`
- No email or PII fields

---

## Sample Rates

| Environment | `tracesSampleRate` |
|---|---|
| `development` | 1.0 (all events) |
| `staging` | 0.5 (recommended) |
| `production` | 0.1 (10%) |

Adjust in `sentry.client.config.ts` and `sentry.server.config.ts` if traffic grows.

---

## Adding Sentry Context to Server Actions

Use the `withSentryAction` HOF (see `accounts.ts` for the canonical example):

```ts
import { withSentryAction } from '@/lib/sentry'

async function _myAction(input: MyInput) {
  // ... implementation
}

export const myAction = withSentryAction(_myAction, 'myAction')
```

This tags Sentry events with `{ context: 'server_action', action: 'myAction' }`.

For inline error capture without wrapping, use:

```ts
import { captureActionException } from '@/lib/sentry'

try {
  // ...
} catch (err) {
  captureActionException(err, 'myAction', { extra: 'context' })
  throw err
}
```
