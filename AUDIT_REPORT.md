# Solana Learn audit

Date: 2026-11-07

Audited commit: `29183832c55c967d2aad05c328e5d0c9f7ba199e` (`main`)

Method: Solana Foundation `solana-dev` skill, program/client security checklist, Cloudflare Worker review, existing tests, targeted local probes, dependency advisories, and read-only Devnet RPC checks.

## Overall assessment

The reviewed Rust program has a small attack surface: one instruction requires an Anchor `Signer` and emits an intentionally public teaching code. It holds no application state, performs no transfers, and invokes no other programs. No critical exploit was identified in the reviewed source. This is a scoped engineering audit, not a guarantee of security or deployed-binary equivalence.

The main actionable findings concern transaction recovery, pre-signing checks, dependency maintenance, and cloud-save status. No source fixes or deployment changes were made during this audit.

## Findings

### F1 — P2: Confirmation failures have no recovery path without another transaction

**Locations:** `app/src/lib/program.ts:58-74`, `app/src/engine/useMissionEngine.ts:110-125`, `app/src/components/ActionZone.tsx:422-432`.

After `sendTransaction` returns a signature, any confirmation exception is reported as a failed check. The signature is retained, which is good, but the next attempt always prepares and submits a new transaction. There is no existing-signature status lookup or UI action to reconcile a receipt. A transaction that succeeds on Devnet while the confirmation RPC connection fails can leave the learner unable to complete the step without making another transaction and paying another test-SOL fee.

**Reproduction:** A local probe mocked one confirmation timeout followed by a successful confirmation, then retried the public transaction function. It observed two wallet submission calls and zero signature-status lookups. This exercised mocked wallet operations only; it did not broadcast transactions.

**Recommended fix:** Persist the transaction signature and lifetime as soon as submission returns. Represent pending/unknown execution separately from a confirmed failure. Offer a receipt recheck using `getSignatureStatuses` with historical lookup where appropriate, validating the expected payer/program/instruction when importing an arbitrary saved receipt. Request another signature only after establishing that a new submission is appropriate or obtaining an explicit retry decision.

Reference: [Solana getSignatureStatuses](https://solana.com/docs/rpc/http/getsignaturestatuses).

### F2 — P2: The preview does not simulate the instruction before wallet signing

**Locations:** `app/src/lib/program.ts:16-46`, `app/src/lib/program.ts:56-60`, `app/src/components/ActionZone.tsx:351-369`.

Preparation verifies the RPC genesis hash, checks that the program account is executable, fetches a blockhash, and calculates a fee. Those checks do not execute the instruction. A program can be executable while rejecting the instruction because its interface changed, or the fee payer can lack sufficient funds. The wallet is still asked to sign before the app has checked those failure conditions by simulation. SDK or wallet submission preflight can happen after signing and does not provide an application-controlled preview of simulation results.

**Evidence:** Source inspection and the transaction retry probe confirmed that `simulateTransaction` is never called, even when the mock provides an execution error for it.

**Recommended fix:** Simulate the prepared transaction without requiring a user signature, block the signing action on simulation errors, and expose an understandable result in the preview. Refresh the preparation when the blockhash or account changes. Simulation improves failure detection; it does not guarantee eventual execution.

Reference: [Solana simulateTransaction](https://solana.com/docs/rpc/http/simulatetransaction), including unsigned simulation with signature verification disabled.

### F3 — P2 maintenance: The dependency tree contains known advisories, including an unused Anchor client

**Location:** `app/package.json:20-29`; exact resolutions in `app/package-lock.json`.

Both `npm audit --json` and `npm audit --omit=dev --json` reported **24 affected package entries: 2 high, 22 moderate, 0 critical**. These are package-entry totals, not 24 independent exploit paths.

The high-severity chain includes the direct `@coral-xyz/anchor@0.30.1` dependency and its `toml@3.0.0` dependency. No import of the Anchor client was found in application or Worker source. The findings therefore do not establish a reachable TOML vulnerability in the deployed website. Nevertheless, an unused vulnerable dependency adds unnecessary maintenance and installation exposure.

Moderate advisory chains include `stream-json@1.9.1` under `@solana/web3.js -> jayson`, and older `uuid` copies under wallet/RPC packages. Browser reachability and each advisory's preconditions need separate evaluation; this audit did not demonstrate an exploit through these paths.

**Recommended fix:** Remove the unused JavaScript Anchor dependency, review supported upstream updates for the remaining dependency paths, and rerun the audit and wallet regressions. Do not apply `npm audit fix --force` blindly or migrate SDKs solely to satisfy a skill's preferred stack. The Rust Anchor program dependency is a separate package and does not need removal because of this JavaScript finding.

References: [TOML prototype pollution advisory](https://github.com/advisories/GHSA-v5mp-jgw5-2x6j), [stream-json advisory](https://github.com/advisories/GHSA-mjw6-4jj6-33hc).

### F4 — P3: Cloud-save status remains ready while a newer device change is pending

**Locations:** `app/src/engine/useProgressSync.ts:136-150`, `app/src/engine/useProgressSync.ts:198-200`, `app/src/components/Stage.tsx:125-126`.

After a synchronized record changes locally, the hook leaves its status and previous success message unchanged until the 700 ms save debounce expires. The UI can therefore continue displaying a saved/enabled state while the cloud still contains the previous record. Closing the page or disconnecting the wallet during this interval cancels the queued save. Browser storage retains the new progress, but another device will see the older cloud record.

**Reproduction:** A local hook probe changed progress after a successful initial cloud load. After 300 ms, the status was still `ready`, the message still said cloud saves were enabled, and only the initial GET had occurred.

**Recommended fix:** Track a distinct dirty/pending state immediately when local and acknowledged cloud progress differ. Show the last acknowledged save separately. Preserve browser storage and make interruption behavior clear; consider a bounded lifecycle flush if it fits the authenticated API, without assuming unload requests always complete.

## Verification results

| Check | Result |
| --- | --- |
| Frontend Vitest suite | 42 tests passed |
| Cloudflare local integration suite | 13 checks passed against real workerd and disposable D1 |
| Frontend lint | Passed |
| Worker TypeScript check | Passed |
| Two additional audit probes | Passed, confirming the current failure behavior described above |
| `cargo test --locked` | Blocked: `program/target/deploy/ctf_sandbox.so` does not exist |
| `cargo test --locked --lib` | Succeeded with **0 tests**; this is not program-runtime validation |
| Live Devnet genesis hash | Matched the application's expected Devnet genesis hash |
| Live program account | Exists, executable, owned by the upgradeable BPF loader |
| Recent on-chain program receipt | Successful execution and expected public teaching log observed at slot `519629753` |

The integration-test dependency on a prebuilt program is at `program/programs/ctf_sandbox/tests/test_trigger_mission.rs:17-20`. Solana CLI, Anchor CLI, and `cargo-build-sbf` were not available in the current PATH. Building the SBF artifact is required before the LiteSVM integration test can compile. Its current assertion only checks successful execution; add checks for the expected log, missing signer, and invalid instruction data after restoring that build path.

The temporary audit probes were removed from the project's test directory and retained at `/tmp/solana-ctf-audit-2026-11-07/audit-repro.test.tsx`. They assert observed defective behavior and should not be treated as the desired regression tests for a fix.

## Controls that held up in the reviewed paths

- Anchor requires a signer for the teaching instruction. The deliberately public flag is consistent with the course and is not treated as a leaked credential.
- Transaction construction uses the expected instruction discriminator, program ID, connected wallet as payer, and explicit Devnet verification.
- Confirmed transaction execution errors do not complete the lesson, and returned signatures are retained on confirmation failures.
- Login challenges use cryptographically random nonces, a five-minute expiry, and atomic single-use consumption. Login signatures are verified with Ed25519.
- Session tokens are random, hashed in D1, and set with HttpOnly, SameSite=Strict, and Secure under HTTPS.
- Mutation requests require a matching Origin. SQL statements use bound parameters. Request bodies are bounded.
- Progress reads and writes derive ownership from the authenticated session. Expected-wallet checks protect against another tab switching the session to a different wallet.
- Atomic revisions prevent a stale device from silently overwriting a newer cloud save.
- Cloud lesson records are explicitly self-reported learning progress, not independently verified credentials.

## Limits and follow-up

No real user wallet was controlled, no transaction was signed or broadcast on a public cluster, and no hosted D1 data was changed for this audit. Browser automation was unavailable in this session, so real Phantom/Solflare/mobile signing and visual behavior remain outside the verified scope. Live RPC observations establish that an executable program and a successful teaching receipt exist; they do not establish that the deployed program binary matches this repository or audit upgrade-authority custody.

Fix transaction reconciliation and pre-signing simulation first. Remove the unused Anchor client and assess remaining reachable dependency advisories next. Restore the SBF build/test workflow before treating program runtime behavior as locally verified.

The Solana skill's required developer MCP server was registered globally as `solana-mcp-server`. Its tools were not exposed in the current turn, so current official documentation was consulted through web retrieval.
