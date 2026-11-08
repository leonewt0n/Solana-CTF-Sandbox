# Visual course redesign

Every lesson now opens with either an illustrated visual walkthrough or its isolated scam simulation. Explanations are presented one stage at a time, with a full-text disclosure. Original safety notes, actionable instructions, assessments, lesson IDs, and saved progress remain intact.

## Artwork

Generated with the built-in image generation tool. Original generated PNGs remain outside the repository; project assets are optimized WebP files under `app/public/illustrations/`. These are decorative conceptual illustrations, not transaction data or wallet screenshots. Each asset is approximately 31–39 KB. The original wallet-keys illustration is preserved.

Exact initial prompt for `course-wallet.webp`:

> Use case: stylized-concept. Asset: single wide editorial chapter illustration for a premium dark Solana beginner education website. Create a sophisticated tactile 3D still life of a frosted glass wallet case, a small stack of translucent ledger tiles, a metallic security key and a floating paper receipt, composed as one coherent sculptural arrangement on a charcoal black seamless background. Restrained lavender, pale mint, warm ivory accents, soft studio lighting, elegant shadows, beautiful material detail. Objects occupy central two thirds, generous dark negative space. No text, letters, numbers, logos, currency symbols, charts, characters, UI screenshots or network-line diagrams. Wide landscape composition. This is decorative learning artwork, not a technical diagram.

The remaining three prompts use this exact template, replacing `{subject}` with the corresponding subject below:

> Use case: stylized-concept. Asset: premium dark educational chapter artwork. Subject: {subject}. Sophisticated tactile 3D editorial still life, charcoal seamless background, restrained pale mint, lavender and warm ivory accents, beautiful frosted glass and brushed metal materials, soft studio shadows. One coherent composition, generous negative space, wide landscape. Match a luxury frosted glass wallet, key and ledger still life. No text, letters, numbers, logos, coins, charts, characters, screenshots or diagram connector lines. Decorative conceptual artwork, not a technical diagram.

| Asset | Subject |
| --- | --- |
| `shared-records.webp` | three elegant translucent ledger slabs in a loose sculptural triangle, small neatly stacked glass record tiles |
| `safe-decisions.webp` | a frosted glass shield standing beside a sealed envelope and a small metallic magnifying glass |
| `transaction-receipt.webp` | a softly curled blank ivory receipt passing through two frosted glass rectangular frames, small lavender glass tiles at its base |

## Verification boundaries

Artwork was visually inspected. This environment exposes no browser surface, so desktop and mobile page rendering has not been visually verified. Responsive CSS and reduced-motion overrides are provided. Interface motion uses HTML/CSS rather than new SVG illustrations or an animation dependency.

Automated coverage exercises scene navigation, explanation access across every lesson, asset availability, out-of-order completion celebrations, existing wallet boundaries, and progress persistence. No real wallet transaction is sent by these checks.
