# CLAUDE.md

Harmonica — LLM-powered deliberation and sensemaking platform. **This is the OSS repo. The Pro repo (`harmonica-web-app-pro/`) is the primary codebase for all development.** They share the same Neon database — check Pro migrations before adding new ones.

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm start            # Run production build
npm run migrate      # Run database migrations
npm run migrate:down # Rollback migrations
```

```bash
# Evals (requires BRAINTRUST_API_KEY, ANTHROPIC_API_KEY, MAIN_LLM_* in .env.local)
npx tsx evals/facilitation.eval.ts       # Synthetic facilitation evals
npx tsx evals/facilitation-real.eval.ts  # Real production session evals
```

No test or lint scripts. Use `npx tsc --noEmit` for type checking. Node >=18 required (<24, which crashes middleware).

## Git Workflow

Always create a branch and open a PR — never commit directly to master.

```
production branch: master (NOT main — PRs to main don't deploy)
branch naming: feature/short-description, fix/short-description
```

## Hard Constraints

- **OSS and Pro share the same Neon database.** Check Pro repo migrations before adding new ones here.
- **OpenAPI spec maintained in two places** — `docs/api-spec.yaml` (this repo) AND `harmonica-docs/api-reference/openapi.yaml`. Both must be updated together.
- **API v1 gotcha:** Under API key auth, `authGetSession()` returns null → `insertHostSessions()` skips owner permission. Always call `setPermission()` explicitly after creating resources via API.
- **`docs/plans/` is gitignored.** Contains pricing strategy, Stripe IDs. Never commit.

## Core Concepts

**Sessions**: A "host session" is a deliberation created by an organizer. Each participant has a "user session" with their conversation thread.

**Projects** (DB: `workspaces` table): Container for organizing sessions with visibility settings and banners.

**Monica**: RAG system in `src/lib/monica/` — Qdrant vector search across session data.

**Cross-Pollination**: Shares insights across sessions. `crossPollination.ts`, enabled per host_session.

**Session Creation**: 4-step flow in `src/app/create/`: Template Selection → Form → Prompt Review → Share.

**LLM Config**: Three tiers (SMALL, MAIN, LARGE) via `{TIER}_LLM_MODEL` / `{TIER}_LLM_PROVIDER`. Providers: openai, anthropic, gemini, publicai, swiss-ai, aisingapore, BSC-LT.

**Permissions**: Role-based in `src/lib/permissions.ts`. Resources: session, workspace.

## Code Style

- Prefer React Server Components; minimize `'use client'`
- Use server actions over API routes where possible
- TypeScript strict mode
- Zod for validation
- Prettier: single quotes, 2-space tabs, semicolons

## Next.js 14 Notes

- External packages: `experimental.serverComponentsExternalPackages` (NOT `serverExternalPackages` — that's Next.js 15+)
- `reactStrictMode: false` to prevent double-load
- API routes with `cookies()` need `export const dynamic = 'force-dynamic'`

## Environment Variables

**Local dev:** `vercel env pull .env.local`, then set `AUTH0_BASE_URL=http://localhost:3000`.

**Required:** `POSTGRES_URL`, `OPENAI_API_KEY`, `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**LLM Config:** `{TIER}_LLM_MODEL`, `{TIER}_LLM_PROVIDER` (per tier: SMALL, MAIN, LARGE)

**Optional:** `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `DEEPGRAM_API_KEY`, `BRAINTRUST_API_KEY`, `DISCORD_OPERATIONS_WEBHOOK_URL`, `DISCORD_ANALYTICS_WEBHOOK_URL`

## Related Repos

- `harmonica-mcp` — MCP server (`npx harmonica-mcp`), wraps v1 API
- `harmonica-chat` — Claude Code slash command for session creation
- `harmonica-docs` — Mintlify docs site (help.harmonica.chat)

## Reference

Read when working on internals: [Architecture](docs/architecture.md) — tech stack, directory structure, API routes, database tables, prompts, evals, middleware, preview deploys.
