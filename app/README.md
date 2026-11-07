# Solana Learn frontend

A beginner learning platform with nine modules and 30 steps: Web3 motivations, blockchain records, network comparisons, common uses, wallet setup, connection, Devnet funding, transaction inspection, scam simulations, and explorer logs. Built with React, TypeScript, Vite, and Solana wallet adapters.

## Run locally

Use Node.js 24 or newer.

```bash
cd app
npm ci
npm run dev
```

Open http://localhost:3000. Stop with Ctrl+C in the server terminal.

```bash
npm test
npm run lint
npm run build
```

## Configuration

Optional `VITE_RPC_URL` and `VITE_PROGRAM_ID` override the Devnet RPC and teaching program address. Public frontend variables are visible to visitors; never place secrets in them. Balance and transaction checks verify the endpoint's Devnet genesis hash. Transaction preview also checks that the teaching program is executable and estimates the fee before enabling signing.

Solflare is available in the wallet picker and through a dedicated choice in the connection lesson. Its adapter explicitly requests Devnet. The installation lesson links to the official Phantom and Solflare downloads; network guidance covers both wallets. Real Solflare extension/mobile signing still requires a manual check.

## Interface and teaching

The dark neutral interface takes inspiration from Phantom’s actual wallet screens: rounded cards, grouped rows, pill controls, and restrained selection colors. Original 3D artwork appears as a small companion; technical diagrams are interactive SVG/HTML with selectable labels and text equivalents. Lesson text is 18px on desktop and 17px on mobile, with supporting text at least 14px. Module completion triggers a short celebration; reduced-motion settings disable confetti and traveling effects.

Foundations need no connected wallet. Every conceptual lesson includes a locally checked decision with specific feedback and retries. Fee and scam scenarios are simulations that never request wallet signatures. The glossary and progress page work independently of wallet connection.

## Learning and progress

Lesson content lives in `src/content/missions.ts`. The course labels self-confirmations, wallet connection checks, Devnet RPC checks, and the local flag answer check separately. Progress is cached in this browser and account. Optional wallet-authenticated cloud sync stores it in Cloudflare D1; lesson completion remains self-reported, not a backend-verified achievement. Version 3 progress deliberately starts the expanded curriculum fresh; earlier version keys remain intact. The contiguous prefix of learning completed before the connection lesson carries from the anonymous session into a newly connected account. Receipts and later progress stay account-specific.

The interface never requests recovery phrases or private keys. Recovery backup and wallet UI network settings cannot be inspected by the app and are explicitly self-confirmed. Receipt lookup uses Solana Explorer with `cluster=devnet`.

Tests cover the walkthrough DOM, progress isolation and restoration, asynchronous responses, fee/network/program guards, successful and failed execution, and exercise codes using mocked wallet/RPC behavior. Actual wallet installation and signing need manual testing with a fresh Devnet wallet.

## Content references

The interface links primary references where relevant. The beginner material avoids speed leaderboards, adoption rankings, and investment recommendations. Sources consulted for this revision (2026-11-07):

- [Bitcoin’s original electronic-cash proposal](https://bitcoin.org/bitcoin.pdf)
- [Ethereum: Web3 motivations and limitations](https://ethereum.org/web3/)
- [NIST: a security perspective on Web3](https://www.nist.gov/news-events/news/2025/02/security-perspective-web3-paradigm-nist-ir-8475)
- [Solana terminology and parallel runtime](https://solana.com/docs/references/terminology)
- [Solana’s original architecture paper](https://solana.com/solana-whitepaper.pdf)
- [Ethereum scaling and layer-2 networks](https://ethereum.org/roadmap/scaling/)
- [Solana payment concepts](https://solana.com/docs/payments/how-payments-work)
- [Solana transactions](https://solana.com/docs/core/transactions) and [fees](https://solana.com/docs/core/fees)
- [Phantom’s actual app screens and setup options](https://help.phantom.com/articles/36482144712083)
- [Phantom: common scams](https://phantom.com/learn/crypto-101/common-crypto-scams)
- [U.S. Copyright Office: NFTs and intellectual-property rights](https://copyright.gov/policy/nft-study/)

The comparison is conceptual, not an assessment that one network is best. Real wallet installation/signing, visual browser QA, and live end-to-end execution remain separate manual checks.

## Cloud progress and deployment

Hosted frontend: https://solana-learn.intelligentape.workers.dev

The frontend and API deploy together as one Cloudflare Worker with static assets. This replaces the earlier Pages-only deployment plan and keeps authentication cookies on the same origin. The D1 binding `DB` stores one progress record per wallet and course version. `wrangler.jsonc` binds the project database in the owner's Cloudflare account; no Cloudflare credentials belong in source control.

To run the complete app locally (Node.js 24+):

```bash
cd app
npm ci
npm run build
npm run db:migrate:local
npm run worker:dev
```

Open http://localhost:8787. Stop with Ctrl+C. Wrangler uses local D1 data under `.wrangler/`, separate from the hosted database. Rebuild with `npm run build` after frontend changes and refresh the Worker URL. `npm run dev` provides a frontend-only preview with browser storage; use the Worker URL when testing cloud login and saves.

Verification:

```bash
npm test
npm run test:cloud
npm run test:accounts
npm run lint
npm run worker:check
npm run build
npx wrangler deploy --dry-run
```

`test:cloud` starts a disposable local Worker on port 8799, applies the real SQL migration, and tests actual Ed25519 signatures and D1 queries with generated test wallets. It never accesses the hosted database. It requires that port to be available.

For the configured Cloudflare account:

```bash
npx wrangler whoami
npm run db:migrate:remote
npm run deploy
```

For a different account, first create `solana-learn-progress` with `npx wrangler d1 create solana-learn-progress`, then replace `database_id` in `wrangler.jsonc` with that account's database ID. Deploy from `app/`, not the repository root. Cloudflare Git builds should use Node.js 24, root `app`, build command `npm run build`, and deploy command `npx wrangler deploy`. Apply migrations before deploying code that requires them. Regenerate binding types with `npm run worker:types` after configuration changes.

### Login and save behavior

- Learning starts anonymously with browser storage. Connecting a wallet does not prompt a signature automatically.
- Choose **Sign in to save progress** and approve a domain-bound message. Signing the login message creates no blockchain transaction, requires no SOL, and grants no asset access. Wallets without message signing can continue using browser storage.
- The Worker verifies an Ed25519 signature against a random, five-minute challenge. Challenges are single-use and bound to an HttpOnly browser cookie. Login requests are limited to 20 challenges per five-minute IP window.
- Sessions last seven days. Tokens are random; only token hashes are stored in D1. HTTPS cookies use Secure, HttpOnly, and SameSite=Strict. Local HTTP development omits Secure. Cross-origin mutations are rejected.
- The authenticated session determines the owner. Requests also identify the expected wallet, preventing another tab's wallet login from redirecting saves into the wrong account.
- The client saves after a 700 ms debounce. The database uses atomic revision checks; stale writes return a conflict instead of overwriting a newer record.
- If cloud and device records differ, the learner explicitly chooses **Use cloud progress** or **Use this device’s progress**. Choosing the device copy replaces the cloud record after the next successful save. Unsynced changes remain in the browser during outages; use **Retry cloud sync** when online.
- Restarting while cloud sync is enabled resets the cloud record after a successful save. Offline or signed-out resets affect only this browser until the learner reconciles the records. Signing out revokes the current browser session and retains browser progress. Disconnecting the wallet stops that wallet's sync in the UI; it does not revoke its existing seven-day cloud session. Use **Sign out of cloud saves** to revoke it.
- D1 stores public wallet addresses, course version, lesson IDs, current step, transaction signatures, revision numbers, and update timestamps. It does not store private keys, recovery phrases, or login signatures. Expired authentication records and hashed IP rate windows are cleaned up on subsequent challenge requests.
- Cloud sync authenticates ownership and validates the progress shape. It does not independently prove that a learner completed lessons or earned a certification.

Frontend `VITE_` variables remain public build-time values. Never put a private RPC credential in them. Wallet sessions use opaque tokens held in D1. Email-code authentication additionally requires the server-only `EMAIL_CODE_SECRET` to authenticate stored code hashes.

Actual wallet-extension signing and mobile wallet behavior still require manual checks. Automated signatures verify the authentication protocol without controlling a real user wallet.

## Learner accounts and moving between browsers

The **Save or move progress** panel works before connecting a wallet. **Create browser-transfer code** stores a single-use introductory-progress snapshot in D1. Open the same site in Solflare, Phantom, or another browser and use **Resume with transfer code**. Transfer codes expire in ten minutes and cannot authenticate an account. Only pre-connection lessons travel: wallet addresses, transaction receipts, and wallet-dependent completions are excluded. Importing a code never replaces more advanced local progress or an existing wallet receipt.

The learner-account schema is additive (`migrations/0002_learner_accounts.sql`). Existing wallet records, revisions, and sessions remain in place. Once email delivery is enabled, **Save with email** sends an eight-digit, ten-minute sign-in code. A learner can sign in before connecting any wallet. Introductory progress is stored against the learner account; wallet-specific records remain keyed by wallet address. Linking a wallet requires a domain-bound wallet signature naming the learner email. A wallet already linked to another learner cannot be silently reassigned. Signing into the same learner account in another browser restores introductory progress; selecting a linked wallet can restore its existing practice record without another login signature. Blockchain transactions still require the actual wallet's authorization.

The progress API requires an `X-Learner-ID` matching the authenticated learner when using an email session. This prevents another tab changing accounts from redirecting pending saves. Wallet-only clients remain supported. Fresh browsers restore a saved record automatically; browsers with different meaningful local progress still require an explicit conflict choice. Email login rotates the learner session and revokes the browser’s previous wallet-login session; it does not automatically claim that wallet. Link it with a fresh signature. Account logout revokes both the current learner session and current legacy wallet session. Other browsers keep their own sessions.

### Current delivery status

Public email sign-in defaults to **disabled**. The configured Cloudflare account returned `Unauthorized [code: 2036]` when inspecting Email Sending, and no verified sender was supplied. The public UI reports that email sign-in is unavailable and offers transfer codes. No upgrade, billing change, DNS change, or real test email is performed automatically.

To enable native Cloudflare email delivery:

1. Enable Email Sending for a verified sender domain in the intended account. Cloudflare's current arbitrary-recipient sending product requires Workers Paid; existing verified-recipient Email Routing is not sufficient for public signups. See [Email Service documentation](https://developers.cloudflare.com/email-service/).
2. Set `EMAIL_FROM` to a verified sender address and `EMAIL_MODE` to `cloudflare` in `wrangler.jsonc`.
3. Set a new random secret with `npx wrangler secret put EMAIL_CODE_SECRET`. Use at least 32 unpredictable characters; never use a fixture or commit the secret. The config declares this secret for generated types. Deploy after the domain and secret are ready.
4. Verify receipt of a real code, expiry, invalid-code handling, account restoration, and wallet linking before announcing email login as available.

Codes are stored as HMAC-SHA-256 digests bound to their challenge ID and email. Raw codes are never logged or stored in D1. Each challenge allows five attempts and is consumed once. Sending is rate-limited per IP and normalized email; verification and transfer routes also have rate limits. Session tokens are random and stored only as hashes. Learner email addresses are stored in D1 to support login and are returned only to the authenticated learner.

### Local email-code development

Create an ignored `.dev.vars` in `app/` from `.dev.vars.example`, set `EMAIL_MODE=local`, and set a random `EMAIL_CODE_SECRET` of at least 32 characters. Then build, apply local migrations, and start `npm run worker:dev`.

Local mode returns a `localCode` to the localhost-only development form and sends no email. The form labels it **Local development only**. This path requires an HTTP loopback URL; even accidentally configuring `EMAIL_MODE=local` on a public HTTPS deployment does not expose codes or permit email authentication. Never configure a production sender to use local mode.

`npm run test:accounts` uses port 8801 and disposable local D1 data. It tests anonymous transfer across browsers, receipt isolation, expiry and replay checks, email-only sessions, linked-wallet restoration, legacy-record preservation, cross-account isolation, logout, and email-code attempt limits. It never sends a real email or changes hosted data. The frontend tests also verify that local test codes cannot be exposed on a public HTTPS URL.

Shared introductory progress is advanced when a linked wallet has completed more introductory lessons. Restarting one wallet's course does not erase another wallet's record or the learner's shared introductory record. To repeat the entire introductory course, sign out and restart the browser record, or add an explicit account-wide reset workflow rather than treating a wallet reset as deletion of every linked record.

## Scam simulations

**Scam practice** in the main navigation opens 14 fictional scenarios without a wallet or course prerequisites. The same simulations appear in the course: the original three retain their lesson IDs, and eleven new learning checks form the Scam practice lab after the original explorer exercises and before the final summary. This placement preserves prior completed lessons and receipts. A learner who previously reached the summary starts at the new lab; new checks are not automatically marked complete.

Scenarios cover unsolicited airdrops, fake support, transfers disguised as free claims, misleading message signatures, blind signing, token delegates, token-account authority changes, poisoned recipients and QR/clipboard verification, phishing and login-code theft, fake installers and remote access, advance-fee investment/task pitches, impersonation tokens and rug/honeypot risks, recovery scams, and incident response. Message signing includes a comparison with an expected domain-bound login. Incident response compares recovery-phrase exposure with an unwanted token permission.

The simulator has no wallet, RPC, network, account, clipboard, or installation dependencies. Every approve/reject action changes local explanatory feedback only. Domains and recipients are non-actionable fictional text; no seed phrase, private key, password, or login-code input is collected by a scenario. Mainnet labels and amounts occur only inside visibly fictional request previews; they do not change the application's Devnet connection. Official source links lead to wallet and Solana documentation.

Free practice does not change course progress. Completing a course learning check uses the existing browser/D1 progress system. Storage version 3 and existing lesson IDs remain compatible; no D1 migration or progress reset is required. The anonymous browser-transfer boundary stays before wallet connection and does not import wallet-dependent achievements.

Technical distinctions are deliberate: a message signature can authenticate a site or authorize an off-chain action; it is not automatically a blockchain transfer. A standard token delegate is limited to the specified token account/allowance. A token-account authority change is not the same as exposing a wallet recovery phrase. Disconnecting a website does not revoke on-chain permissions. No badge, simulation preview, or absence of an unverified warning is presented as a guarantee of safety.

Sources are recorded per scenario in `src/content/scams.ts`, using Solana documentation, Phantom and Solflare support, and MetaMask's address-poisoning explanation. Scenarios and quiz copy are original training examples rather than replicas of wallet UI. Real browser visual QA remains a separate manual check.
