@AGENTS.md

# CLAUDE.md — COK: City of Karis

Real estate development city. Website + (planned) mobile app. Luxury aesthetic, world-class UX, production-ready code.

> **Repo orientation:** This single repository now contains both the Next.js application and the project-meta artefacts (playbook, trackers, audits, brand assets, marketing assets). What follows is the project-level guide; for the Next.js / React-19 / Turbopack caveats specific to the web tree, the `@AGENTS.md` reference at the top of this file pulls in [`AGENTS.md`](AGENTS.md). Read both before writing code.

---

## Project Structure

```
.                                  ← repo root (this directory)
├── app/                           ← Next.js 16 App Router (admin + resident + access + demo)
├── components/                    ← shared React components
├── lib/                           ← business logic (currency, ledger, email, storage, etc.)
├── prisma/                        ← schema + 7 Phase 1+ migrations
├── public/                        ← static assets, PWA icons, sw.js, .well-known/
├── tests/e2e/                     ← Playwright specs (10 files)
├── docs/                          ← owner-facing runbooks (go-live, play-store, etc.)
│   └── phase1plus/                ← per-prompt protocol files + 00-brief.md
├── scripts/                       ← generators (PWA icons, feature graphic, screenshots, seed)
├── legal/                         ← privacy + terms markdown drafts
├── qa/                            ← canonical trackers + §9 audit + block checkpoints
├── marketing/                     ← Play Store listing assets (icons, feature graphic, screenshots, copy)
├── brand_assets/                  ← logos, brand guide PDFs, palette
├── reference/                     ← Phase 1 playbook + content briefs
├── COK-Phase1Plus-ClaudeCode-Playbook.md   ← authoritative product spec (Appendix D = closure checklist)
├── CLAUDE_EXECUTION_ROOT.md       ← execution protocol (§5 / §9 / §11)
├── PROJECT-HANDOVER.md            ← single source of truth — read first
├── BUILD_LOG.md                   ← Phase 1 build log (8 sessions)
├── DEMO.md                        ← 5-minute demo script
├── CLAUDE.md, AGENTS.md           ← this file + Next 16 caveats
└── package.json, etc.
```

**Always check `brand_assets/` before designing anything.** If assets exist, use them exactly.

**A new session should read [`PROJECT-HANDOVER.md`](PROJECT-HANDOVER.md) first** — its §13 tells you exactly which 8 files to read in what order.

---

## Skill Invocation — When to Call What

### Every UI session (mandatory)
```
/frontend-design          ← first, every session, no exceptions
/ui-ux-pro-max            ← for high-quality design work
/top-design               ← for premium/award-level visual craft
```

### Before writing any copy or headlines
```
/storybrand-messaging     ← hero sections, headlines, CTAs (customer = hero)
/obviously-awesome        ← positioning, value proposition, market category
/made-to-stick            ← key messages that must be memorable
```

### Architecture decisions (before writing backend/API code)
```
/clean-architecture       ← dependency direction, layering
/api-design               ← before any API endpoint design
/system-design            ← scalability trade-offs
```

### Design quality gates (after each major section/screen)
```
/refactoring-ui           ← visual audit: spacing, hierarchy, color, depth
/ux-heuristics            ← usability score 0-10 (must reach 8+ before moving on)
/microinteractions        ← hover, focus, loading, error states
/ios-hig-design           ← after every mobile screen
```

### Conversion & lead generation
```
/cro-methodology          ← before landing page sections and inquiry forms
/page-cro                 ← page-level conversion optimization
/scorecard-marketing      ← lead qualification assessment design
/hundred-million-offers   ← offer/package framing
/hooked-ux                ← engagement loops: saved searches, favorites, alerts
```

### Product decisions
```
/jobs-to-be-done          ← feature prioritization: what job does the buyer hire this for?
/lean-startup             ← MVP scoping and assumption testing
```

---

## Design Standards (Non-Negotiable)

These apply to both website and (future) mobile app.

- **Colors:** Custom brand palette only. Never default Tailwind indigo/blue/gray.
- **Shadows:** Layered, color-tinted, low opacity. No flat `shadow-md`.
- **Typography:** Display/serif for headings + clean sans for body. Never the same font.
- **Animations:** Only `transform` + `opacity`. Spring easing. Never `transition-all`.
- **States:** Every interactive element must have hover, focus-visible, active states.
- **Depth:** Three-layer surface system: base → elevated → floating.
- **Gradients:** Layer multiple radial gradients. Add grain/texture for depth.
- **Images:** Add gradient overlay (`from-black/60`) and color treatment layer.

---

## Verification Standard

- **Website:** Always serve from `localhost:3000`, never `file:///`. Take at least 2 screenshot comparison rounds per section.
- **Mobile (planned):** Test on iOS Simulator. Screenshot light + dark mode per screen.
- **Never mark a section done without a passing `/ux-heuristics` score ≥ 8.**
- **Plan Mode before any feature spanning >2 files.**

---

## Tech Stack

| Layer | Stack |
|---|---|
| Web | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui |
| Auth | Clerk (`@clerk/nextjs@7.x`) — TOTP MFA enforced for staff roles |
| Database | Postgres (Supabase) + Prisma 7 |
| Email | Resend + react-email |
| File storage | Hand-rolled encrypted driver (AES-256-GCM local + SSE-S3); HMAC-signed URLs |
| Rate limiting | Upstash Redis + in-memory fallback |
| Observability | Sentry (`@sentry/nextjs@10.x`) with PII scrub |
| Tests | Vitest 4 (unit, 396/396) + Playwright 1.59 (E2E, 9 active / 1 deferred) |
| PWA | Hand-rolled `public/sw.js` (no `next-pwa`/`@serwist`); TWA via Bubblewrap |
| Forms | React Hook Form + Zod |
| Mobile (planned) | TWA via Bubblewrap; Phase 2 candidate for native Expo |
