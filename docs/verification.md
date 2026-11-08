# Local audit-fix verification

Original implementation scope: local fixes and automated checks. A subsequently authorized app deployment is recorded below. No program redeployment, real-wallet signing, or test participant recruitment was performed.

## Completed checks (2026-11-08)

- Node.js 24.14.0: clean `npm ci` completed.
- Unit tests: 136 passed across 10 suites.
- Disposable cloud API: 13 checks passed.
- Disposable learner/account API: 12 checks passed, including v3 migration and transfer-code compatibility.
- Lint: passed without warnings.
- Frontend TypeScript/Vite build: passed. The existing large-chunk warning remains (main bundle about 1.11 MB before gzip).
- Worker TypeScript check and `git diff --check`: passed.

## Automated coverage

The unit suites cover evidence requirements and quiz bypass rejection; withheld answers; comparison resets; all final assessment decisions; v3 index migration and original-record preservation; account-isolated receipts; exact-message signing; expiry; rejection; altered instructions; sufficient funds, network and fee checks; durable-storage failure; interrupted broadcast; receipt reconstruction and recorded balance changes; unresolved-attempt blocking; restored receipts; and owner/recipient changes. Cloud sync tests include conflicts, account changes, offline behavior, and stale acknowledgements followed by another save.

Two disposable local workerd/D1 suites exercise real API authentication and revision semantics, introductory transfer codes, email test-mode sessions, wallet linking, account isolation, expiry/replay, and origin checks. Generated test-wallet cryptographic signatures are distinct from real Phantom/Solflare signing.

GitHub Actions is configured for Node.js 24, `npm ci`, unit tests, lint, frontend build, Worker type checks, and both disposable API suites. CI execution on GitHub remains unverified until pushed.

## Dependency review

The unused Anchor JavaScript dependency was removed; the Rust/Anchor teaching program is unchanged. `npm audit --json` after the lockfile refresh reported 21 moderate advisories and zero high/critical advisories. These include transitive `stream-json` denial-of-service/prototype-pollution advisories through `jayson`/web3.js, and a `uuid` buffer-boundary advisory through wallet dependencies. This counts affected package paths, not 21 distinct root vulnerabilities.

No forced upgrades or overrides were applied. npm reports no compatible fix for several paths and proposes an incompatible Solflare downgrade for another. Retaining the current wallet integration was an explicit scope constraint. These advisories remain outstanding; passing tests do not resolve them.

## Browser, device and learner coverage

| Surface | Coverage in this revision | Still required |
|---|---|---|
| Desktop layout | DOM rendering and navigation tests | Visual inspection of home, scenario, transfer and receipt at desktop widths |
| Mobile layout | Responsive styles retained; evidence fields wrap | Visual inspection at 390px and 320px, wallet-browser viewport and long-address overflow |
| Keyboard | Native buttons, inputs, selects and disclosure controls; accessible names covered by DOM queries | End-to-end Tab/Shift+Tab, Enter/Space, focus visibility, focus order and menu/dialog behavior in a real browser |
| Phantom extension | Mocked wallet API boundaries | Device connect, rejection, exact signing, refresh recovery and disconnect |
| Phantom mobile | No device session | Same workflow inside wallet browser |
| Solflare extension | Mocked wallet API boundaries | Device connect, rejection, exact signing, refresh recovery and disconnect |
| Solflare mobile | No device session | Same workflow inside wallet browser |
| Five beginners | Protocol delivered only | Authorized recruitment and observed independent completion |

The available computer-use environment reported no apps or browsers and “No browser is available” when asked for the local URL. Therefore desktop/mobile visual and real-browser keyboard validation remain outstanding. No physical device was accessed.

## Manual release checklist

Use a fresh practice wallet, only Devnet, and learner-controlled Wallet B. Check the full recipient, 0.001 SOL amount, fee at or below 50,000 lamports, simulation success, exact reviewed message, and successful execution receipt. Reject one request and verify no broadcast. Let one preview expire and verify renewed review. Refresh after signing and verify reconciliation blocks duplicate submission. Repeat owner changes and restored connection/disconnect checks. Record wallet, browser, OS, device and exact version for each run.

Never clear site data to escape an unresolved attempt. Course reset intentionally retains attempts. Investigate the saved public signature through historical lookup instead.

## Authorized deployment (2026-11-08)

Deployed the frontend and progress Worker to https://solana-learn.intelligentape.workers.dev using Wrangler 4.158.0. Active Worker version: `7dc3725e-9111-4385-b5d0-4d825fd75f46`, serving 100% of traffic according to the deployment record. Existing D1 migrations were already applied; no database migration was needed.

The production homepage and all 31 built static files match the local build by SHA-256, following the canonical `/index.html` redirect. The live API returned 200 for the anonymous account endpoint, 401 for unauthenticated progress, and JSON 404 for an unknown API route. Email login remains disabled; localhost test-code mode is unavailable on production. No real learner account, signed wallet operation, or production progress mutation was used for verification.

Build, lint, and Worker type checks passed again immediately before deployment. Browser visual/keyboard checks and physical-wallet behavior remain unverified. The Rust teaching program was not redeployed. This deployment does not imply the working-tree changes were committed or pushed to GitHub.
