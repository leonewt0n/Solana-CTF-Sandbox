# Solana Learn

A beginner learning app for wallet safety, Devnet transfers, request inspection, and transaction receipts. Threat scenarios are fictional simulations. All lessons remain open; browsing a lesson never completes it.

Start with **Try your first scam challenge**, or **Start learning from zero**. The recommended course covers wallet setup and secrets, connection permissions, Devnet funding, a 0.001 Devnet SOL transfer between two accounts you create, threat decisions, a teaching-program call, and receipt investigation. Protocol foundations and advanced authorities remain available as optional lessons.

Each scenario includes a legitimate comparison. Completion requires inspecting request-specific evidence, choosing an action, and identifying supporting evidence. Three new final assessments test proceeding, rejecting, and investigating an unresolved receipt. Mistakes are retryable. Completion is a learning record, not a certification.

## Run locally

Use Node.js 24.

```bash
cd app
npm ci
npm run build
npm run db:migrate:local
npm run worker:dev
```

Open http://localhost:8787. Stop with Ctrl+C. Rebuild after frontend edits. For frontend-only development, run `npm run dev` and open http://localhost:3000; API login and cloud saves need the Worker.

```bash
npm test
npm run lint
npm run build
npm run worker:check
npm run test:cloud
npm run test:accounts
```

Both API suites create disposable local D1 databases. They use ports 8799 and 8801 and send no email or blockchain transactions. GitHub Actions runs these checks on pushes and pull requests with Node.js 24 and `npm ci`.

## Demo and configuration

- [Live app](https://solana-learn.intelligentape.workers.dev) — deployed 2026-11-08; all 31 built static files verified by SHA-256.
- [Teaching program on Devnet Explorer](https://explorer.solana.com/address/4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa?cluster=devnet).
- Optional frontend environment variables: `VITE_RPC_URL` and `VITE_PROGRAM_ID`. These are public configuration, never secrets.

The app verifies Devnet genesis before wallet operations. It uses the existing wallet-adapter integration and web3.js API. A transfer sends exactly 0.001 Devnet SOL to your independently reviewed Wallet B. Both transfers and program calls simulate before review, cap fees at 50,000 lamports, sign the exact reviewed message, and durably save the identifier before broadcasting. An unresolved attempt blocks another transaction. Expiry or changed details require a new review. [Solana confirmation guidance](https://solana.com/developers/cookbook/transactions/confirmation) informs reconciliation.

Receipts verify successful execution and recorded balance changes. Current balances can include other activity. Old training-transfer launch controls are removed; their browser receipts remain available for reconciliation in transaction lessons. A separate, clearly disclosed training-message exercise remains in connection-permission teaching.

## Progress and accounts

Version 4 uses stable lesson IDs, assessment results, and separate transfer/program receipt references. Version 3 browser and cloud records retain their originals. Migration maps old indices to the frozen old lesson list, preserves unaffected completions and program receipts, and requires renewed scam assessments. Receipt references never travel through anonymous or cross-wallet introductory migration. Browser-transfer codes carry introductory learning only, including redeeming unexpired version 3 codes.

Learner accounts can use configured email-code delivery, then link wallets by signing an explicit login message. Connecting alone never authenticates a cloud account or signs a transaction. Cloud changes stay pending until the acknowledged snapshot matches current progress. See [app operations](app/README.md).

## Repository and contributions

- `app/`: React, TypeScript, Vite, wallet integration, and Cloudflare Worker/D1 progress API.
- `program/`: Rust/Anchor teaching program. It deliberately emits a public `CTF{...}` practice code in logs. The local answer check is not competitive proof.
- Git history records contributions from Anshul Jain/AnshulSancheti, Leo Newton, and Eva. No role split, eligibility claim, or external audit is inferred from those author records.

See [verification status](docs/verification.md) and [five-person beginner-study protocol](docs/beginner-study.md). The app and Worker were deployed on 2026-11-08 after explicit authorization. No program redeployment, real-wallet signing, or participant recruitment was performed.
