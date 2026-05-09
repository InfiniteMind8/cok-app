# Phase 1+ Strategic Brief

**Mission.** Bridge the City of Karis Community App from working MVP to community-grade tool ready for day-one residents.

**Five axes:**
1. Functionally complete (every Phase 1+ feature from the assessment)
2. Brand-consistent and emotionally coherent
3. Production-grade: security, observability, reliability
4. Deployable to Google Play Store
5. Demonstrably tested across four quality gates

**Block sequence:**
- **A** — Phase 1 critical fixes (A.1 email, A.2 fee editor, A.3 approvals)
- **B** — Brand & UI consistency (B.1 sign-in, B.2 modals, B.3 forms)
- **C** — New functional requirements (C.1 multi-currency, C.2 visitor groups, C.3 rental cycle)
- **D** — Hardening (D.1–D.15: bulk import, MFA, audit log, storage, Sentry, rate limiting, E2E, Playwright, webhooks, email suite)
- **E** — Quality gates (E.1 function, E.2 security, E.3 UX/a11y, E.4 code quality)
- **F** — Production readiness (F.1 build hardening, F.2 Play Store packaging)

**Quality bar:** No partial wiring. Every form complete. Every error has a message. Every action is auditable. Every secret in env. Every state recoverable.

**Sacred invariant:** The K Credit ledger is append-only, double-entry, decimal-precise, and transaction-wrapped. Currency display is presentation; currency conversion is a ledger event. These must never blur.
