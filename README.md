🚩 On-Chain CTF Sandbox: Solana Explorer 101

Built for the "Best Beginner Hack" Track

## Current learning experience

Solana Learn now offers an eight-module, 19-step beginner course, starting without a wallet: why Web3 exists, how blockchain records work, Solana and network tradeoffs, and common uses. It then guides wallet setup and Devnet practice, includes three safe scam scenarios, and finishes with explorer evidence and the public log-code exercise.

The dark neutral course interface uses larger text, compact original 3D accents, interactive 2D diagrams, learning checks with explanatory feedback, a searchable glossary, and reduced-motion-aware module celebrations. Progress remains local to the browser and account. No deposit, custody, recovery-phrase input, or real-wallet scam transaction is involved.

See [the frontend README](app/README.md) for commands, content sources, configuration, progress-version behavior, and verification limits. The live demo placeholder below is not a deployment claim.

## Try it

- **Live demo:** _(coming soon — deploy URL goes here)_
- **Program ID (Devnet):** `4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa`
- **Explorer:** [Program on Solana Explorer (Devnet)](https://explorer.solana.com/address/4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa?cluster=devnet)

Fund your Solana CLI wallet with Devnet SOL at the [Solana Faucet](https://faucet.solana.com/), then from `program/` run `anchor deploy --provider.cluster devnet`. Judges can use the live demo without building locally once the frontend is deployed.

## Overview

Learning how to build on Solana is exciting, but navigating a block explorer for the first time can be overwhelming. The On-Chain CTF (Capture The Flag) Sandbox is an interactive, beginner-friendly educational tool designed to teach new developers and crypto-curious users how to read on-chain data.

We deployed a simple, deliberately "misconfigured" smart contract to the Solana Devnet. Users interact with our web portal to trigger transactions, and then they must dive into the Solana Explorer logs to uncover a hidden "flag" emitted by the program.

## Features

- **Wallet Integration:** Connect Phantom, MetaMask (Solana), Backpack, or Solflare wallets.
- **Interactive Missions:** Trigger devnet transactions directly from the UI.
- **Guided Tutorials:** Step-by-step hints on how to open a transaction signature in a block explorer and read the program logs.
- **Flag Verification:** A submission box to verify the hidden string (flag) found in the on-chain logs.

## Tech Stack

- **Frontend:** React.js, TailwindCSS
- **Blockchain Integration:** `@solana/web3.js`, `@solana/wallet-adapter`, `@metamask/connect-solana`
- **Smart Contract (Program):** Rust, Anchor Framework
- **Network:** Solana Devnet

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (v24+)
- Rust
- Solana CLI
- Anchor

### Installation

Clone the repository:

```bash
git clone https://github.com/leonewt0n/Solana-CTF-Sandbox.git
cd Solana-CTF-Sandbox
```

Build and Deploy the Anchor Program (Devnet):

```bash
cd program
anchor build
anchor keys sync
anchor deploy --provider.cluster devnet
```

Install Frontend Dependencies:

```bash
cd ../app
npm install
```

Run the Development Server:

```bash
npm run dev
```

Open http://localhost:3000 to view the app in your browser.

## How to Learn

1. Follow the course instructions to set up a fresh practice wallet privately.
2. Connect the wallet and switch its interface to Solana Devnet.
3. Request free test SOL using your public address at the official faucet.
4. Review the teaching program, action, and estimated fee before opening your wallet.
5. Approve only if the details match, then wait for successful transaction execution.
6. Inspect the saved transaction on the Devnet explorer, find its public exercise code in the program logs, and check your answer.
7. Review the learning summary or revisit any completed lesson without repeating the transaction.

## The Team (First-Time Hackers)

Team is **>50% first-time hackers / first Solana builders** (eligible for Best Beginner Hack).

- [Diana] - Frontend & Web3 Integration
- [Leo] - Anchor Program Development
- [Anshul] - UI/UX & Documentation

This project was built as our very first Solana hackathon submission!
