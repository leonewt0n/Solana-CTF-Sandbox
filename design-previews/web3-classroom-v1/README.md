# Solana Learn — visual direction v1

Historical design exploration, superseded by the implemented dark, neutral learning interface. The user requested less purple, smaller illustrations, and inspiration from Phantom’s actual app screens after reviewing this pack. These images remain as source artwork and design history; they do not represent the current application.

## Visual direction

A friendly visual Web3 classroom: Kaggle-inspired learning structure with Phantom-inspired lavender and approachable original illustrations. No copied brand mascots or claim of affiliation.

- Canvas: #F7F5FF and #FFFFFF.
- Text: #242232, with a readable muted charcoal for secondary descriptions.
- Primary controls: #6543D5 with white text.
- Illustration lavender: #B8A8F5; secondary highlight: #20BEFF.
- Typeface direction: Inter or Plus Jakarta Sans, medium-weight headings and regular-weight lesson copy.
- Actual implementation targets: 18–20px lesson text on desktop; at least 17px on mobile; at least 14px supporting labels; 44px minimum touch targets.
- Illustrations use soft dimensional forms, clear silhouettes, and restrained lighting. The exact instructional meaning remains in accessible text and interactive code-based diagrams.

Generated design images are visual references. Text, color swatches, spacing, and scale in raster mockups are illustrative; the written values above govern implementation. A screenshot of a button or diagram does not indicate working behavior.

## Preview assets

- 01-style-board.png — palette, typography, components, and illustration direction.
- 02-desktop-lesson.png — the proposed desktop foundation lesson.
- 03-mobile-lesson.png — a mobile adaptation of the same teaching idea.
- 04-shared-records.png — original illustration of peers sharing records.
- 05-wallet-and-keys.png — original illustration separating key protection from a public address.
- 06-transaction-journey.png — original illustration of signing, submission, and a receipt.

These are original generated concepts. The three illustration assets are intended as reusable source assets after approval, not exact technical diagrams or wallet screenshots. Never add a real recovery phrase, private key, or personal wallet address to them.

## Teaching structure

A short foundation comes before wallet creation. Every concept follows: a plain-language explanation, a visual example, a small interaction or real Devnet action, and feedback explaining the outcome. Definitions appear when first needed. Avoid long lists of unexplained terminology.

Proposed beginner path:

1. Why Web3? Start with familiar accounts and records; explain the motivations for shared networks, the historical role of Bitcoin, and that Web3 is a broad, contested term rather than a necessary replacement for every app.
2. Blockchain basics. Explain transactions, shared ledgers, validators, keys, and the difference between a wallet interface and network state.
3. Why Solana? Explain the choice for this course and compare Solana, Bitcoin, Ethereum, and Ethereum layer-2 networks by intended use, fee asset, execution model, and tradeoffs. Do not invent speed benchmarks or a universal best network.
4. What people use these tools for. Cover transfers and stablecoin payments, trading and other DeFi activity, digital collectibles, and application access. Label examples separately from claims about adoption. Verify current sources before writing final material; cover limitations and costs alongside uses.
5. Your first wallet. Creation, recovery, public addresses, and connection, using official wallet instructions.
6. Networks, fees, and transactions. Practice with Devnet funds and explain every request before signing.
7. Recognize risky requests. Simulated airdrops, support impersonation, and transaction review. No harmful transaction is sent to a real wallet.
8. Read the receipt. Explorer status, execution result, signer, program, and the existing public log-code exercise.

The desktop mockup groups some of these topics into seven navigation modules for visual demonstration; exact lesson grouping will be finalized after design approval. Completing a quiz is not proof of wallet ownership, an audit, or a certification.

## Motion and interaction direction

- Record comparison: switching tabs changes a shared-record diagram with a short 200–300ms transition. Labels and text explain the distinction independently of animation.
- Transaction journey: learner-triggered stages highlight signing, submission, execution, and receipt inspection. Show failure and pending states; never animate guaranteed success before RPC confirmation.
- Decisions: selected answers receive visible selection states and explanatory feedback, not just a green/red flash. Retry remains available.
- Progress: a short visual update after genuine lesson completion. Confetti plays once per newly completed module for roughly 1 second, behind controls and away from text. Reviewing a completed lesson does not repeat it.
- Reduced motion: remove confetti, loops, and traveling elements. Use immediate state changes and readable completion text.
- Every activity works by keyboard and has a text equivalent. No learning point depends only on color, hover, sound, or animation.

## Review focus

Approve or revise the overall style, readability, illustration treatment, desktop/mobile lesson arrangement, and the explain–explore–decide–feedback teaching pattern. This review stage is complete. See the application and frontend README for the implemented direction.
