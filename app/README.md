# Solana Learn frontend

A guided learning platform for wallet setup, connection, Devnet funding, transaction inspection, and explorer logs. Built with React, TypeScript, Vite, and Solana wallet adapters.

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

## Learning and progress

Lesson content lives in `src/content/missions.ts`. The course labels self-confirmations, wallet connection checks, Devnet RPC checks, and the local flag answer check separately. Progress is local to this browser and account, not a backend-verified achievement. Version 2 progress intentionally does not migrate the former fairy-stage state. Only the three anonymous setup acknowledgments carry into a newly connected account; receipts and later progress stay account-specific.

The interface never requests recovery phrases or private keys. Recovery backup and wallet UI network settings cannot be inspected by the app and are explicitly self-confirmed. Receipt lookup uses Solana Explorer with `cluster=devnet`.

Tests cover the walkthrough DOM, progress isolation and restoration, asynchronous responses, fee/network/program guards, successful and failed execution, and exercise codes using mocked wallet/RPC behavior. Actual wallet installation and signing need manual testing with a fresh Devnet wallet.
