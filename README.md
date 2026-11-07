# On-Chain CTF Sandbox: Solana Explorer 101

**Track:** Best Beginner Hack

A tiny educational dApp that teaches beginners how to read Solana on-chain data. You send a Devnet transaction, open it in Solana Explorer, find a flag in **Program Instruction Logs**, and submit it in the UI.
## Current learning experience

Solana Learn now offers an eight-module, 19-step beginner course, starting without a wallet: why Web3 exists, how blockchain records work, Solana and network tradeoffs, and common uses. It then guides wallet setup and Devnet practice, includes three safe scam scenarios, and finishes with explorer evidence and the public log-code exercise.

The dark neutral course interface uses larger text, compact original 3D accents, interactive 2D diagrams, learning checks with explanatory feedback, a searchable glossary, and reduced-motion-aware module celebrations. Progress is cached locally, with optional wallet-authenticated Cloudflare D1 sync across devices. No deposit, custody, recovery-phrase input, or real-wallet scam transaction is involved.

See [the frontend README](app/README.md) for commands, content sources, configuration, progress-version behavior, and verification limits. The frontend and progress API are hosted together on Cloudflare Workers, with progress stored in Cloudflare D1.

## Try it

- **Live demo:** [Solana Learn](https://solana-learn.intelligentape.workers.dev)
- **Program ID (Devnet):** `4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa`
- **Explorer:** [Program on Solana Explorer (Devnet)](https://explorer.solana.com/address/4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa?cluster=devnet)

The program is intentionally chatty: it emits `CTF{...}` into the logs on purpose so you can practice using a block explorer.

## Try it

| | |
|---|---|
| **Live demo** | _(coming soon — deploy URL goes here)_ |
| **Program ID (Devnet)** | `4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa` |
| **Explorer** | [Program on Solana Explorer (Devnet)](https://explorer.solana.com/address/4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa?cluster=devnet) |

The program is already deployed on Devnet. For a local UI you only need the frontend (see below). Redeploy the program only if you change Rust code.

## How to play

1. Switch your wallet to **Devnet** (Phantom / Solflare / Backpack).
2. Get free Devnet SOL from the [Solana Faucet](https://faucet.solana.com/).
3. Open the app → connect wallet → click **Trigger Mission Instruction**.
4. Approve the transaction.
5. Open the Explorer deep-link from the UI (keep `cluster=devnet`).
6. Scroll to **Program Instruction Logs** and copy the `CTF{...}` string.
7. Paste it into **Submit flag** on the web portal.
- **Wallet Integration:** Connect Phantom, MetaMask (Solana), Backpack, or Solflare wallets.
- **Interactive Missions:** Trigger devnet transactions directly from the UI.
- **Guided Tutorials:** Step-by-step hints on how to open a transaction signature in a block explorer and read the program logs.
- **Flag Verification:** A submission box to verify the hidden string (flag) found in the on-chain logs.

## Project layout

```
app/       React + Vite frontend (wallet, mission UI, flag check)
program/   Anchor program on Devnet (emits the flag in logs)
```
- **Frontend:** React.js, TailwindCSS
- **Blockchain Integration:** `@solana/web3.js`, `@solana/wallet-adapter`, `@metamask/connect-solana`
- **Smart Contract (Program):** Rust, Anchor Framework
- **Network:** Solana Devnet

## Run the frontend (usual path)

Program is already on Devnet — no Rust/Anchor needed to try the app.

**Need:** Node.js 18+

```bash
git clone https://github.com/leonewt0n/Solana-CTF-Sandbox.git
cd Solana-CTF-Sandbox/app
npm install
npm run dev
```
- Node.js (v24+)
- Rust
- Solana CLI
- Anchor

Open [http://localhost:3000](http://localhost:3000).

Frontend env (`app/.env`):

```env
VITE_PROGRAM_ID=4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa
VITE_RPC_URL=https://api.devnet.solana.com
```

More frontend detail: [`app/README.md`](app/README.md).

## Redeploy the program (optional)

**Need:** Rust, Solana CLI, Anchor. Fund `~/.config/solana/id.json` via the [faucet](https://faucet.solana.com/).

```bash
cd program
anchor build
anchor keys sync
anchor deploy --provider.cluster devnet
```

If the Program ID changes, update `app/.env` (`VITE_PROGRAM_ID`) and the IDL under `app/src/idl/`.

## Features

- Wallet connect: Phantom, Backpack, Solflare
- One mission: call `trigger_mission` on Devnet
- Guided hints for Explorer + program logs
- Client-side flag verify (SHA-256 hash — plaintext flag is not stored in the UI)

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Web3:** `@solana/web3.js`, `@solana/wallet-adapter`
- **Program:** Rust + Anchor
- **Network:** Solana Devnet
## How to Learn

1. Follow the course instructions to set up a fresh practice wallet privately.
2. Connect the wallet and switch its interface to Solana Devnet.
3. Request free test SOL using your public address at the official faucet.
4. Review the teaching program, action, and estimated fee before opening your wallet.
5. Approve only if the details match, then wait for successful transaction execution.
6. Inspect the saved transaction on the Devnet explorer, find its public exercise code in the program logs, and check your answer.
7. Review the learning summary or revisit any completed lesson without repeating the transaction.

## Team

Eligible for Best Beginner Hack (**>50%** first-time hackers / first Solana builders).

- **Diana** — Frontend & Web3 Integration
- **Leo** — Anchor Program Development
- **Anshul** — UI/UX & Documentation

Built as our first Solana hackathon submission.
