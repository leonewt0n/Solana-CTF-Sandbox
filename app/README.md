# App operations

See the [root README](../README.md) for the course, local commands, demo, and verification overview.

## Local services

Use Node.js 24 and `npm ci`. `npm run dev` serves frontend-only development on port 3000. For API behavior, build, run `npm run db:migrate:local`, then `npm run worker:dev` on port 8787. Stop either process with Ctrl+C. Local data lives under `.wrangler/`; test suites create and remove their own temporary databases.

`wrangler.jsonc` contains the existing Worker and D1 binding. No hosting or remote database change is required for this local revision. Version 4 progress uses the existing versioned tables. Version 3 rows remain intact and are normalized on restore; version 4 saves create separate rows.

## Optional email-code development

Copy `.dev.vars.example` to ignored `.dev.vars`, set `EMAIL_MODE=local`, and provide a random `EMAIL_CODE_SECRET` of at least 32 characters. On an HTTP loopback origin, local mode shows a clearly labeled test code and sends no email. It cannot enable email login on public HTTPS. Public email delivery needs separately configured Cloudflare Email Routing and a verified sender; no sender setup is included here.

The Worker uses single-use domain-bound wallet challenges, verifies Ed25519 signatures, hashes session tokens, checks mutation origins, rate-limits requests, and uses revision checks for cloud saves. Learner identity and wallet ownership are checked separately. An unlinked wallet can receive introductory progress but cannot import another wallet's receipts. Browser-transfer codes expire after ten minutes and grant no login session.

## Transaction recovery

Transfer and program attempts use `solana-learn:transactions:v1:<owner>:<action>`, separate from course progress. Signed identifiers and exact request metadata are stored and read back before broadcast. Web Locks prevent overlapping operations across same-origin tabs; unsupported browsers fail closed. Refreshing a transaction lesson reconciles a saved attempt without signing. Reconciliation checks historical signature status, the signed execution message, fee, and recorded balance changes. Missing or inconsistent evidence leaves the outcome unresolved.

Old `solana-learn:live-devnet:v1:` receipts remain readable and have explicit reconciliation controls in transfer/program lessons. No suspicious scenario launches their old transfer actions. Resetting course progress retains all transaction attempts. These records are browser-local; clearing browser site data removes local recovery metadata. Save the public transaction identifier if moving devices.

## Content and source locations

- Curriculum and optional lessons: `src/content/missions.ts`.
- Scenario evidence and comparisons: `src/content/scams.ts`.
- Frozen v3 navigation mapping: `src/content/legacyLessonIds.ts`.
- Progress normalization and account-safe introductory projection: `src/engine/progress.ts`.
- Transaction lifecycle: `src/lib/transactionLifecycle.ts`.
- API: `worker/index.ts`, `worker/accounts.ts`.

Lessons retain linked primary references. Simulator decisions never call wallets, RPC, installation APIs, or secret-entry services. The optional training-message signature is disclosed separately in connection teaching. Real-wallet coverage and learner outcomes must be recorded independently of mocked tests.
