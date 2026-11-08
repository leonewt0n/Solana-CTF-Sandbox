> Historical design record. The audit-fix revision removes transfer launch controls from threat scenarios. Current behavior and coverage are documented in [verification](../docs/verification.md) and the [README](../README.md).

# Real wallet scam exercises

Five course lessons offer a **Preview / Real wallet practice** switch. Preview remains the default and retains the existing wallet-independent simulator. The separate free-practice page remains preview-only. A live exercise never awards course completion; the existing learning checks remain authoritative.

| Lesson | Live variant |
| --- | --- |
| `scam.airdrop` | A fictional reward claim asks for an upfront native SOL payment. The preview's recovery-phrase request is not reproduced. |
| `scam.blind` | A request labeled verification actually transfers native SOL. |
| `scam.address` | Compare the full practice-account address with the different actual training recipient. |
| `scam.returns` | An upfront payment claims to unlock a payout. No payout exists. |
| `scam.message` | Sign and locally verify a domain-bound, nonce-bearing, training-only message. No authentication endpoint receives the signature. |

## Bounds and destination

- Only Solana Devnet is accepted, verified by genesis hash before preparation, signing, submission, and receipt recovery.
- Every transfer contains exactly one System Program transfer for **1,000,000 lamports (0.001 Devnet SOL)**. The fee estimate must be at most **50,000 lamports (0.00005 SOL)**. No priority-fee, delegate, authority, or other program instruction is accepted.
- The sender is also the sole signer and fee payer. The learner sees the actual recipient, amount, fee estimate, and simulation result before a wallet request.
- The fixed public destination is **Gtvzd8EYDxhXL6JSKDNoNwfJ5menLSqK3L4gJnuDYBuN**. It is the canonical teaching program's PDA for seed `scam-training-sink-v1`, bump 255, derived from `4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa`. It remains fixed when the ordinary teaching-program configuration is overridden. Its derivation is independently checked in a Node test.
- The exercise has **no payout or automatic refund**. Do not buy test SOL. Use a fresh practice account and Devnet faucet funds.
- The learner acknowledges the bounds for the currently connected account. Switching accounts resets consent and previews. Each repeat is a new, explicit payment, not a recurring permission.
- Neither message nor transfer signatures authorize the app to access other accounts or collect keys. No secret input is added.

## Submission and recovery

The transfer adapter isolates the existing wallet-adapter/web3.js legacy transaction interface; there is no SDK migration or custom on-chain program deployment.

The flow is: acknowledge, prepare and simulate, review, request wallet approval, validate the signed message/instructions/signature, save the transaction identifier, recheck the network and active account, then broadcast once with preflight enabled and RPC retries disabled.

Local receipt persistence must succeed before broadcasting. An unknown RPC outcome retains the signature. The learner can check it in the course or Devnet Explorer. A confirmed status alone is insufficient: the adapter also reads the transaction, validates the signed transfer, and checks execution errors before reporting a successful loss. Failed execution is distinct from an expired, unobserved attempt and may still incur a fee.

A pending receipt blocks new transfers across the supported live scenarios for that account. Web Locks serialize operations across same-origin tabs; browsers without Web Locks fail closed and can still use Preview. An unobserved attempt is closed only after finalized block height exceeds the transaction's last valid height and a second history lookup still finds no signature. Nothing automatically requests a replacement signature or payment.

Transfer records use `solana-learn:live-devnet:v1:<wallet>:<scenario>` in browser storage, separate from course progress and cloud authentication. The latest record for each scenario is retained. Deleting browser storage removes local recovery information. Verified message feedback lasts for the current visit and is not a blockchain receipt.

## Validation

Automated tests use synthetic test keys and mocked RPC/wallet interfaces; no test sends a real blockchain transaction. They cover transaction bounds, simulation, signature validation, wrong networks, insufficient balance, persistence failure, account changes, duplicate actions, uncertain submission, receipt verification, expiry, unsupported capabilities, real off-chain Ed25519 verification, consent, and preservation of course progress.

Run from `app`:

```sh
npm test
npm run lint
npm run build
npm run worker:check
npm run test:cloud
npm run test:accounts
```

Manual wallet/browser checks are **not yet verified**. Before publication, check Phantom and Solflare on desktop and their mobile browsers using a fresh Devnet account: decline a prompt; approve one bounded transfer; inspect its receipt; sign a training message; switch accounts during a request; reload with a pending receipt. Confirm the wallet displays the actual native transfer and full recipient. This implementation does not simulate a secret theft, arbitrary wallet drain, or real token authority change.
