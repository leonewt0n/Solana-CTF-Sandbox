🚩 On-Chain CTF Sandbox: Solana Explorer 101

Built for the "Best Beginner Hack" Track

## Try it

- **Live demo:** _(coming soon — deploy URL goes here)_
- **Program ID (Devnet):** _(fill in after `anchor deploy`)_
- **Explorer:** [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)

Judges can use the live demo without building or deploying the Anchor program locally.

## Overview

Learning how to build on Solana is exciting, but navigating a block explorer for the first time can be overwhelming. The On-Chain CTF (Capture The Flag) Sandbox is an interactive, beginner-friendly educational tool designed to teach new developers and crypto-curious users how to read on-chain data.

We deployed a simple, deliberately "misconfigured" smart contract to the Solana Devnet. Users interact with our web portal to trigger transactions, and then they must dive into the Solana Explorer logs to uncover a hidden "flag" emitted by the program.

## Features

- **Wallet Integration:** Seamlessly connect Phantom, Backpack, or Solflare wallets.
- **Interactive Missions:** Trigger devnet transactions directly from the UI.
- **Guided Tutorials:** Step-by-step hints on how to open a transaction signature in a block explorer and read the program logs.
- **Flag Verification:** A submission box to verify the hidden string (flag) found in the on-chain logs.

## Tech Stack

- **Frontend:** React.js, TailwindCSS
- **Blockchain Integration:** `@solana/web3.js`, `@solana/wallet-adapter`
- **Smart Contract (Program):** Rust, Anchor Framework
- **Network:** Solana Devnet

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (v16+)
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

## How to Play

1. Switch your Solana wallet to Devnet and ensure you have some devnet SOL (use the [Solana Faucet](https://faucet.solana.com/)).
2. Click the **Trigger Mission Instruction** button in the web UI.
3. Approve the transaction in your wallet.
4. Copy the resulting Transaction Signature (or use the deep-link from the UI).
5. Go to [Solana Explorer](https://explorer.solana.com/?cluster=devnet) and paste the signature (keep `cluster=devnet`).
6. Scroll down to the **Program Instruction Logs** and find the hidden flag (it looks like `CTF{...}`).
7. Submit the flag back on the web portal to win!

## The Team (First-Time Hackers)

Team is **>50% first-time hackers / first Solana builders** (eligible for Best Beginner Hack).

- [Your Name] - Frontend & Web3 Integration
- [Teammate Name] - Anchor Program Development
- [Teammate Name] - UI/UX & Documentation

This project was built as our very first Solana hackathon submission!
