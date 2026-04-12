# Harmonica OSS Architecture Reference

Read this file when working on internals. Not loaded every session.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon Postgres with Kysely query builder
- **Auth**: Auth0 (`@auth0/nextjs-auth0`, route at `src/app/api/auth/[auth0]/route.ts`)
- **LLM**: LlamaIndex with OpenAI/Anthropic/Google/PublicAI providers
- **Vector DB**: Qdrant for RAG queries
- **State**: Zustand (`src/stores/`)
- **UI**: Tailwind CSS + Radix UI + Shadcn components
- **Payments**: Stripe
- **Analytics**: PostHog
- **File Storage**: Vercel Blob

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Authenticated dashboard routes
│   ├── api/                # API routes (see API Routes below)
│   ├── chat/               # Chat interface
│   ├── create/             # Session creation flow (4 steps)
│   ├── sessions/[id]/      # Session detail pages
│   └── workspace/[w_id]/   # Project pages
├── actions/                # Server actions (file uploads)
├── components/             # React components (Shadcn in ui/)
├── db/migrations/          # Kysely migrations (000-038, gap at 002, collision at 025)
├── lib/
│   ├── monica/             # RAG/LLM query system
│   ├── schema.ts           # Database schema types
│   ├── db.ts               # Database queries (~69KB)
│   ├── modelConfig.ts      # LLM provider configuration
│   ├── permissions.ts      # Role-based access control
│   ├── crossPollination.ts # Cross-session idea sharing
│   └── defaultPrompts.ts   # Prompt templates
├── hooks/                  # React hooks
└── stores/                 # Zustand state stores
```

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/[...auth0]` | Auth0 authentication |
| `/api/builder` | Session prompt generation (CreatePrompt, EditPrompt, SummaryOfPrompt) |
| `/api/sessions` | Session CRUD |
| `/api/sessions/generate` | Generate session content |
| `/api/user/subscription` | Subscription management |
| `/api/llama` | LLM query endpoint |
| `/api/webhook/stripe` | Stripe webhooks (subscriptions, refunds → Discord notifications) |
| `/api/admin/prompts` | Admin prompt management (CRUD) |
| `/api/admin/prompt-types` | Prompt type management (CRUD) |
| `/api/admin/evals` | Braintrust experiment results (list + detail) |
| `/api/participant-suggestion` | Participant suggestions |
| `/api/sessions/[id]/generate-characters` | Generate conversation character personas |
| `/api/transcribe` | Audio transcription (Deepgram) |

## API v1 (`/api/v1/`)

Public REST API with Bearer token auth (`hm_live_` API keys). Shared libs in `src/app/api/v1/_lib/`:
- `auth.ts` — `authenticateRequest()` supports both API key (Bearer) and Auth0 session
- `mappers.ts` — DB row → API response mappers
- `errors.ts` — Standardized error responses
- Types: `src/lib/api-types.ts`

**Gotcha:** Under API key auth, `authGetSession()` returns null, so `insertHostSessions()` skips setting owner permission. Always call `setPermission(id, 'owner', 'SESSION', user.id)` explicitly after creating resources via the API.

## Database

Schema interfaces in `src/lib/schema.ts`, queries in `src/lib/db.ts`.

**Actual table names differ from interface names:**

| Table name | Interface | Purpose |
|------------|-----------|---------|
| `host_db` | `HostSessionsTable` | Deliberation sessions (prompt, settings, cross_pollination flag) |
| `user_db` | `UserSessionsTable` | Individual participant conversations |
| `messages_db` | `MessagesTable` | Chat messages per thread |
| `workspaces` | `WorkspacesTable` | Session containers with visibility settings |
| `permissions` | — | Role-based access control |
| `prompts` / `prompt_type` | — | Custom prompt templates |
| `session_files` | — | Uploaded files (Vercel Blob) |
| `daily_usage` / `usage_limits` | — | Subscription tracking |
| `session_ratings` | `SessionRatingsTable` | Session feedback (1-5 rating, free-text per thread) |
| `api_keys` | `ApiKeysTable` | User API keys (hashed, with prefix and revocation) |

## Prompt System

Templates in `src/lib/defaultPrompts.ts`:
- `BASIC_FACILITATION_PROMPT` - Fallback facilitation guidance
- `SUMMARY_PROMPT` - Session summarization
- `PROJECT_SUMMARY_PROMPT` - Multi-session project summary

Retrieval: `getPromptInstructions(typeId)` in `src/lib/promptActions.ts` checks DB first, falls back to defaults.

## Evals

Facilitation quality measured by 5 LLM-as-judge scorers (in `evals/shared/scorers.ts`): relevance, question_quality, goal_alignment, tone, conciseness. Each scores 0.0–1.0 with a reason.

Two eval scripts:
- `evals/facilitation.eval.ts` — 7 synthetic test cases, generates new facilitator responses, then judges. Weekly via GitHub Actions (`evals-digest.yml`, Fridays 10 AM UTC).
- `evals/facilitation-real.eval.ts` — pulls up to 20 real production threads (last 14 days, ≥6 messages) from Neon, judges actual responses (identity task). Requires `POSTGRES_URL`.

Results log to Braintrust under project `harmonica-facilitation`, viewable at `/admin/evals`.

## Braintrust Integration

`src/lib/braintrust.ts` provides `getBraintrustLogger()` for production LLM call logging and `traceOperation()` for hierarchical spans. Optional — warns if `BRAINTRUST_API_KEY` not set.

## Middleware

`src/middleware.ts` handles auth and bot detection:
- **Auth**: `withMiddlewareAuthRequired` from `@auth0/nextjs-auth0/edge`
- **Bot detection**: `isbot` rewrites bots to `/bots/` routes
- **Public bypass**: `?access=public` query param skips auth on any route
- **Unauthenticated routes**: `/api`, `/login`, `/chat`, static assets

## Preview Deploys

`next.config.js` auto-derives `AUTH0_BASE_URL` from `VERCEL_BRANCH_URL` at build time. Access previews via: `harmonica-web-app-git-{branch}-harmonica.vercel.app`.

**Vercel gotcha:** `$VAR` and `${VAR}` references are NOT expanded inside env var values. System env vars must be read in code, not referenced in other env var strings.
