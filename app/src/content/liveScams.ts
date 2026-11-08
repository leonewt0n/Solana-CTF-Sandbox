export type LiveScam = {
  kind: "transfer" | "message";
  title: string;
  invitation: string;
  action: string;
  explanation: string;
};

/** Live variants are deliberately narrower than the fictional scenarios. */
export const LIVE_SCAMS: Record<string, LiveScam> = {
  "scam.airdrop": {
    kind: "transfer",
    title: "The reward that asks you to pay",
    invitation:
      "A fictional promotion says: pay a verification charge to claim your bonus.",
    action: "Review the claim in my wallet",
    explanation:
      "You authorized a payment, not a reward claim. Receiving a legitimate asset does not require giving a stranger a verification payment. This exercise uses only a native Devnet SOL transfer; it does not reproduce the recovery-phrase request in the preview.",
  },
  "scam.blind": {
    kind: "transfer",
    title: "The verification that is a payment",
    invitation:
      "A fictional app asks you to verify your wallet. Compare that claim with the payment shown below and in your wallet.",
    action: "Review the verification in my wallet",
    explanation:
      "A button labeled verification can request a transfer. The transaction instructions and wallet preview determine what you authorize, not the button's label.",
  },
  "scam.address": {
    kind: "transfer",
    title: "The recipient that changed",
    invitation:
      "Imagine moving funds to your own practice account. This request instead names the course training destination. Compare both full addresses before deciding.",
    action: "Review the recipient in my wallet",
    explanation:
      "The requested recipient was the training destination, not your own practice account. Check the entire address against an independently verified destination, rather than relying on its beginning or ending.",
  },
  "scam.returns": {
    kind: "transfer",
    title: "The payout behind an upfront fee",
    invitation:
      "A fictional task platform says an upfront payment will unlock a larger payout. No payout exists in this exercise.",
    action: "Review the unlock payment in my wallet",
    explanation:
      "You sent the upfront payment. A promise of future returns does not change what this transaction does, and this exercise provides no payout or automatic refund.",
  },
  "scam.message": {
    kind: "message",
    title: "A real signature, without a transfer",
    invitation:
      "Inspect a training message before signing it. The course name, website origin, scenario, and one-time nonce are visible in the exact message below.",
    action: "Review the training message in my wallet",
    explanation:
      "This was an off-chain training message signature. It did not itself transfer SOL or grant token permissions. Other signed messages can have consequences in the services that accept them, so always review their purpose and origin.",
  },
};
