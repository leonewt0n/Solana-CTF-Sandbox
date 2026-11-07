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

Lesson content lives in `src/content/missions.ts`. The course labels self-confirmations, wallet connection checks, Devnet RPC checks, and the local flag answer check separately. Progress is local to this browser and account, not a backend-verified achievement. Version 3 progress deliberately starts the expanded curriculum fresh; earlier version keys remain intact. The contiguous prefix of learning completed before the connection lesson carries from the anonymous session into a newly connected account. Receipts and later progress stay account-specific.

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
