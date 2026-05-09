# CLAUDE_EXECUTION_ROOT.md
## City of Karis Community App — Phase 1+ Root Execution Protocol
**Version:** 1.0  
**Purpose:** Root operating protocol for Claude Code execution of Phase 1+ using `COK-Phase1Plus-ClaudeCode-Playbook.md` as source of truth.  
**Scope:** Governance/process controls only (not the “start now” command).

---

## 0) Authority and Precedence

1. `COK-Phase1Plus-ClaudeCode-Playbook.md` is the authoritative product/build spec.
2. This file is the authoritative **execution protocol** (how work is run, validated, and reported).
3. If this protocol conflicts with the playbook’s feature requirements, the playbook’s feature requirements win; execution discipline in this file still applies.
4. No prompt may be skipped or reordered.

---

## 1) Canonical Inputs and Working Artifacts

### Required inputs
- `COK-Phase1Plus-ClaudeCode-Playbook.md` (master spec)
- Existing repository code and docs
- Existing QA outputs under `/qa/` (if present)

### Required generated working artifacts
Create and maintain:

- `/docs/phase1plus/00-brief.md`  
  Condensed strategic brief from Parts I–V.
- `/docs/phase1plus/prompts/A.1.md` … `/docs/phase1plus/prompts/F.2.md`  
  One file per execution prompt.
- `/docs/phase1plus/appendices.md`  
  Consolidated appendices from playbook.

- `/qa/phase1plus-progress.md` (master tracker)
- `/qa/risk-register.md` (active risks/blockers)
- `/qa/decision-log.md` (assumptions/ambiguities/clarifications)
- `/qa/evidence-index.md` (tests, screenshots, outputs by prompt)
- `/qa/block-[A-F]-checkpoint.md` (one file per block checkpoint)
- Final quality-gate reports per playbook:
  - `/qa/function-test-report.md`
  - `/qa/security-test-report.md`
  - `/qa/ux-accessibility-report.md`
  - `/qa/code-quality-report.md`

---

## 2) Prompt Sequencing and Execution Model

### Strict sequence
Execute in this exact order:

- Block A: `A.1 → A.2 → A.3`
- Block B: `B.1 → B.2 → B.3`
- Block C: `C.1 → C.2 → C.3`
- Block D: `D.1 → ... → D.15`
- Block E: `E.1 → E.2 → E.3 → E.4`
- Block F: `F.1 → F.2`

### Hard gate
- Do **not** start prompt `N+1` until prompt `N` acceptance criteria are all met (or explicitly documented as accepted deferment by project owner).

### Per-prompt execution loop (mandatory)
For each prompt:
1. Read the relevant prompt file and referenced sections.
2. Pre-implementation summary:
   - Scope in 5 bullets
   - Acceptance criteria list
   - Expected files touched
   - Tests to run
   - Risks/dependencies
3. Implement in small coherent commits (Conventional Commits).
4. Run required validations/tests.
5. Return structured handover (exact format in Section 8 below).
6. Update trackers (`progress`, `risk`, `decision`, `evidence`).

---

## 3) Context and Token Discipline

### Primary objective
Minimize token consumption while preserving correctness.

### Rules
1. Do not re-paste large documents in chat.
2. Use only:
   - active prompt file,
   - directly referenced sections,
   - necessary code context.
3. Summarize changes by file path + intent; avoid dumping entire files unless requested.
4. Show only relevant test output; expand logs only for failures/debug.
5. Keep a compact running status in `/qa/phase1plus-progress.md` so historical context is file-based, not chat-based.
6. Reuse stable references:
   - “Per `prompts/C.1.md acceptance criteria #3`”
   - “Evidence: `/qa/evidence-index.md` entry [C.1-04]”

---

## 4) Error Prevention and Drift Control

### Non-negotiable constraints
1. No schema changes without Prisma migration.
2. No new dependency without rationale in handover.
3. No silent test disable.
   - If skip is unavoidable: add `TODO(phase1+)` + prompt reference + reason.
4. No UI-only authorization controls.
   - Server Action/route authorization required.
5. No secrets in repo. Env-only for secrets.
6. No acceptance claims without evidence path.

### Ambiguity handling
- Ask exactly one clarifying question when genuinely ambiguous.
- If forced to proceed, log explicit assumption in `/qa/decision-log.md`.

---

## 5) Checkpoints (Anti-Regression Control)

Run a block checkpoint after each completed block (A, B, C, D, E, F).

### Block checkpoint procedure
1. Verify all prompt acceptance criteria in block.
2. Re-run relevant tests for touched areas.
3. Detect and list regressions introduced.
4. Update master progress tracker.
5. Produce `/qa/block-[X]-checkpoint.md` with:
   - Completed prompts
   - Acceptance status per prompt
   - Test summary
   - Regressions/fixes
   - Remaining risks/blockers

No next block starts until checkpoint is complete.

---

## 6) Parallelization Policy (Safe Use Only)

### Default
Sequential execution.

### Allowed limited parallelization
Only for low-coupling tasks:
- docs updates,
- screenshot collection,
- fixture preparation,
- template previews (where core infra already exists).

### Prohibited parallelization
Do not parallelize deeply coupled backend prompts, especially:
- A.1 (email infra),
- C.1 (currency/conversion core),
- C.3 (lease lifecycle),
- D.11 (storage architecture),
- D.13 (webhook idempotency/security).

---

## 7) Required Tracking Files (Live)

## `/qa/phase1plus-progress.md` must include
- Prompt ID
- Status: Not Started / In Progress / Blocked / Done
- Acceptance met: Yes/No
- Commit hash(es)
- Test status
- Evidence links
- Open blockers

## `/qa/risk-register.md` must include
- Risk ID
- Description
- Impact
- Likelihood
- Owner
- Mitigation
- Status

## `/qa/decision-log.md` must include
- Decision ID
- Date
- Context
- Decision
- Alternatives considered
- Consequence

## `/qa/evidence-index.md` must include
- Prompt ID
- Evidence type (test/screenshot/report/manual)
- Path
- Short note

---

## 8) Mandatory Handover Format (Use Exactly)

At the end of every prompt, return:

## Prompt [Block.Id] handover

### Done
- [bullet list of completed items]

### Files touched
- [path/to/file.ts] — [one-line note: created / modified / deleted]
- ...

### New dependencies
- [package@version] — [one-line rationale]
- (or "None.")

### Tests added or updated
- [path/to/test.ts] — [one-line note]
- (or "None — and here is why: …")

### Migrations
- [migration name] — [one-line summary]
- (or "None.")

### Known issues / deferred items
- [item] — [why deferred / what will pick it up]
- (or "None.")

### Validation evidence
- [test output snippet, screenshot path, manual check note]
- ...

### Acceptance check
- [criterion 1] — Met / Not met (reason)
- [criterion 2] — Met / Not met (reason)
- ...

### Next prompt
- [the next prompt id this engagement should run]

If any acceptance criterion is “Not met,” do not advance.

---

## 9) Final Readiness and Closure Gate

After F.2, run a single final audit and produce release packet.

### Final audit requirements
1. Validate every checkbox in playbook Appendix D with explicit evidence paths.
2. Provide final verdicts:
   - Phase 1+ implementation readiness: Go / No-Go
   - Production deployment readiness: Go / No-Go
   - Play Store submission readiness: Go / No-Go
3. Include:
   - Completed checklist
   - Open issues/deferred items
   - Risk summary
   - Recommended immediate next actions

### Final output files (minimum)
- `/qa/final-phase1plus-readiness.md`
- Updated `/qa/phase1plus-progress.md` (all prompts final status)

---

## 10) Commit Hygiene Standard

Use Conventional Commits:
- `feat(scope): ...`
- `fix(scope): ...`
- `chore(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`

Rules:
1. One prompt = one coherent commit set.
2. No “misc fixes” or “wip” commits.
3. Include migration and test changes in same prompt commit set when relevant.

---

## 11) Definition of Done (Per Prompt)

A prompt is only Done when all are true:
1. Feature/fix implemented as specified.
2. Acceptance criteria explicitly marked Met with evidence.
3. Required tests pass.
4. Handover returned in exact format.
5. Tracking files updated.
6. No unresolved Critical/High issue introduced.

---

## 12) Operational Reminder

- This file governs **how** execution is run.
- The playbook governs **what** must be built.
- Execute deliberately, evidence-first, with no skipped gates.
