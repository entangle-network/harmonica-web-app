# Harmonica Web App — Process Notes

## 2026-03-06 — Pricing credit system shaping + Pro audit
- **Done:** Completed pricing shaping (B-D10 two-layer gating, B-D11 API/agent access). Audited Pro codebase billing system — found "responses" model was never implemented (marketing copy only). Updated 4 Linear issues (HAR-126/127/128), closed 4 shaping issues (HAR-130/170/171/172), updated HAR-173/175 to $399. Updated both Notion docs and local plan files with current state assessment, Stripe infrastructure, transition plan.
- **Decisions:** B-D10 (editors/custom prompts ungated, API keys tier-gated), B-D11 (same credit costs for all clients, 402 not 429, X-Credits headers)
- **State:** 11 pricing decisions finalized (B-D1–B-D11). All documented in `docs/plans/pricing-decisions-shape-b.md`. LTD email v3 ready to send ($399 payment link live). Credit system is greenfield build — no real responses system to migrate from.
- **Next:** Send LTD email (phase 0). Then HAR-126 (server-side enforcement) → HAR-127 (credit system build).

## 2026-03-10 — API v1 questions format fix
- **Done:** Fixed questions format bug in POST /sessions — `{text}` from API now maps to `{label}` in DB. Merged PR #49 (v1 API routes) and PR #50 (questions fix). Updated `api-types.ts` to use `Array<{ text: string }>`.
- **Decisions:** External API uses `{text: string}` for questions, internal DB stores `{id, label, type, required}`. Mapping happens in POST route (text→label) and GET /questions route (label→text).
- **State:** Both fixes deployed to Vercel production. Same fix applied to Pro.
- **Next:** None from OSS side — bot testing continues from telegram-bot repo.
