# Solana Learn frontend

A beginner learning platform with eight modules and 19 steps: Web3 motivations, blockchain records, network comparisons, common uses, wallet setup, connection, Devnet funding, transaction inspection, scam simulations, and explorer logs. Built with React, TypeScript, Vite, and Solana wallet adapters.

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

Frontend `VITE_` variables remain public build-time values. Never put a private RPC credential in them. No application session secret is required because opaque sessions are held in D1.

Actual wallet-extension signing and mobile wallet behavior still require manual checks. Automated signatures verify the authentication protocol without controlling a real user wallet.
