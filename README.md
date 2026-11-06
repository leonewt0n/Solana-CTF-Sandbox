# On-Chain CTF Sandbox: Solana Explorer 101

**Track:** Best Beginner Hack

A tiny educational dApp that teaches beginners how to read Solana on-chain data. You send a Devnet transaction, open it in Solana Explorer, find a flag in **Program Instruction Logs**, and submit it in the UI.

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

## Project layout

```
app/       React + Vite frontend (wallet, mission UI, flag check)
program/   Anchor program on Devnet (emits the flag in logs)
```

## Run the frontend (usual path)

Program is already on Devnet — no Rust/Anchor needed to try the app.

**Need:** Node.js 18+

```bash
git clone https://github.com/leonewt0n/Solana-CTF-Sandbox.git
cd Solana-CTF-Sandbox/app
npm install
npm run dev
```

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

## Team

Eligible for Best Beginner Hack (**>50%** first-time hackers / first Solana builders).

- **Diana** — Frontend & Web3 Integration
- **Leo** — Anchor Program Development
- **Anshul** — UI/UX & Documentation

Built as our first Solana hackathon submission.
