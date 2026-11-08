# Five-person beginner study protocol

## Purpose and recruitment boundary

Evaluate whether a beginner can independently set up a practice workflow, inspect evidence, and distinguish legitimate, malicious, and unresolved requests. This is a protocol, not a report of completed research. No participants have been recruited and no outcomes are claimed.

Recruit five adults with no previous Solana transaction experience after separate authorization. Obtain informed consent for observation and timing. Assign participant codes P1–P5. Record device/browser/wallet versions and prior wallet experience without collecting names, addresses, seed phrases, private keys, or screen recordings of backup steps. Participants create their own fresh Devnet wallets privately and retain control of signing. Do not fund Mainnet or request purchases.

## Session script (45–60 minutes)

1. Give the participant the local or separately approved study build. Say: “Explore this learning app. You may reject any wallet request. Please explain what you notice.” Start timing when the home page appears.
2. Ask them to complete the first scam challenge without a hint. Record inspected evidence, first decision, evidence selection, errors, and time to decision.
3. Ask them to start from zero, create Wallet A privately, explain what can be shared, connect, select Devnet, and obtain test SOL. Pause observation during secret backup. Record each completed milestone and any help needed.
4. Ask them to create Wallet B and send exactly 0.001 Devnet SOL. Before signing, ask them to explain the full recipient, amount, network, fee payer, fee, and expected effects. Record address mistakes, misunderstanding of connection versus signing, signing/rejection, and recovery from uncertainty.
5. Ask them to inspect the receipt and explain the sender's recorded change, recipient's recorded change, and fee. Ask why current balances may differ. Do not tell them the answer first.
6. Let them complete threat lessons and legitimate comparisons. Record first decisions separately from successful retries. Do not teach “reject everything.”
7. Present the three final assessments without hints: the expected login, unrelated spending permission, and unresolved receipt. Record decision and supporting evidence before showing feedback. A deliberate refusal to sign a real request remains acceptable; record it separately from classification accuracy.
8. Ask them to explain connection restoration, disconnection, and where to check wallet permissions. Ask what remains uncertain about the app or requests. End timing.

## Hint ladder

Allow 90 seconds of visible difficulty before offering a hint, unless the participant asks or becomes uncomfortable. Record every hint and its time.

- H0: No assistance.
- H1: Repeat the task without naming the evidence.
- H2: Point to the relevant section, without interpreting it.
- H3: Explain the evidence or demonstrate the action. This task is assisted, not independently completed.

Never ask participants to show recovery words or approve a request they cannot explain. Stop the real-wallet portion if a Mainnet account, unexpected permission, or wrong recipient appears.

## Observation sheet

Use one row per participant and task:

| Participant | Task | Independent completion | First decision | Evidence correct | Errors and recoveries | Hints (level/count) | Start/end | Active seconds | Notes |
|---|---|---|---|---|---|---|---|---|---|
| P1–P5 | Milestone or assessment ID | Yes/no/declined | Proceed/reject/investigate | Yes/no | Concrete behavior | H0–H3 | Timestamps | Exclude private backup pauses | No secrets |

Keep first-attempt and eventual results separate. Record abandonment, skipped lessons, invalid/self destinations, truncated-address comparisons, repeated approvals, treating connection as signing, and treating a transaction ID as success. For uncertainty, distinguish investigation from indiscriminate rejection or retrying a payment.

## Analysis and next decision

Report counts out of five, medians and ranges for timing, hint counts, and observed errors. Include missing data and withdrawals. Do not infer general population effectiveness from five participants.

Explicitly report indiscriminate rejection: participants who reject both legitimate final/login requests and malicious requests without evidence. Report the legitimate, malicious, and unresolved assessments separately, along with evidence accuracy and confidence in their own words.

A candidate iteration target is at least four independent completions of the transfer and receipt explanation, four correct first decisions with evidence for each final assessment, and no unrecovered wrong-recipient approval. These are design targets, not validated safety thresholds. Fix recurring failures before recruiting another round; retain observed evidence and document changes.
