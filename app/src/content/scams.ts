import type { Mission, Step } from "./missions";
import { LIVE_SCAMS } from "./liveScams";

export type PracticeChoice = { id: string; label: string; feedback: string };
export type ScamRequest = {
  label: string;
  kind: string;
  origin: string;
  claim: string;
  fields: [string, string][];
  clues: string[];
  choices: PracticeChoice[];
  recommended: string;
};
export type ScamScenario = {
  id: string;
  title: string;
  objective: string;
  setup: string;
  takeaway: string;
  request: ScamRequest;
  comparison?: ScamRequest;
  question: string;
  answers: [string, string, string];
  correct: number;
  source: { label: string; href: string };
};
const safety = {
  label: "Solana: staying safe",
  href: "https://solana.com/learn/staying-safe-on-solana",
};
const impersonation = {
  label: "Phantom: impersonation scams",
  href: "https://help.phantom.com/hc/en-us/articles/40411433367187-How-to-spot-Phantom-related-scams",
};
const tokens = {
  label: "Phantom: common token scams",
  href: "https://help.phantom.com/articles/37418827844755",
};
const recovery = {
  label: "Solflare: responding to a compromised wallet",
  href: "https://help.solflare.com/en/articles/13522176-what-should-i-do-if-my-solflare-wallet-is-compromised-or-funds-are-stolen",
};
const reject = (feedback: string): PracticeChoice => ({
  id: "stop",
  label: "Reject simulated request",
  feedback,
});
const proceed = (feedback: string): PracticeChoice => ({
  id: "proceed",
  label: "Approve simulation",
  feedback,
});

// All domains, recipients, assets, payloads, and amounts below are fictional training content.
// No scenario creates an executable instruction, requests a signature, or accepts a secret.
export const SCAM_SCENARIOS: ScamScenario[] = [
  {
    id: "scam.airdrop",
    title: "An unexpected token is not an invitation.",
    objective: "Separate receiving spam from following its instructions.",
    setup:
      "An unsolicited collectible appears in a fictional wallet with a reward notice attached.",
    takeaway:
      "A displayed asset can carry untrusted advertising. Hide or report suspicious content through your wallet's own controls; do not follow its claim link.",
    request: {
      label: "Airdrop claim",
      kind: "Website request",
      origin: "bonus-claim.example",
      claim: "Your 10 SOL bonus expires in five minutes.",
      fields: [
        ["Requested information", "Recovery phrase"],
        ["Where the link came from", "An unsolicited collectible description"],
        ["Why the site says it needs it", "Unlock the reward"],
      ],
      clues: [
        "A token appearing in a wallet is not a wallet endorsement.",
        "A recovery phrase is not needed to receive an asset.",
      ],
      choices: [
        proceed(
          "In a real scam, entering recovery words could expose the accounts derived from them. No words are collected here.",
        ),
        reject(
          "Stop at the request for secrets. Check the promotion independently and use the wallet's report controls.",
        ),
      ],
      recommended: "stop",
    },
    question: "What creates the danger in this example?",
    answers: [
      "Simply receiving an unsolicited token",
      "Following its instructions and exposing recovery secrets",
      "Opening the wallet's own asset list",
    ],
    correct: 1,
    source: tokens,
  },
  {
    id: "scam.support",
    title: "A helpful stranger asks for control.",
    objective: "Recognize impersonation even after a convincing conversation.",
    setup:
      "A supposed moderator notices a question in chat and moves the conversation into a private message.",
    takeaway:
      "Find support through an independently verified channel. A familiar logo or a helpful conversation does not justify sharing recovery words or remote control.",
    request: {
      label: "Support conversation",
      kind: "Direct message",
      origin: "wallet-fix.example",
      claim:
        "I can synchronize your wallet if you follow my private repair link.",
      fields: [
        ["Requested access", "Recovery words and remote screen control"],
        ["Pressure", "Your ticket closes in two minutes"],
        ["Identity evidence", "A copied support avatar"],
      ],
      clues: [
        "The request changes from giving advice to obtaining control.",
        "A screenshot or badge in a chat is not independent verification.",
      ],
      choices: [
        reject(
          "End the exchange and open the official help site yourself. No legitimate support workflow needs you to give a person your recovery secrets.",
        ),
        proceed(
          "A real attacker could use that access beyond the supposed repair. This simulation grants no access.",
        ),
      ],
      recommended: "stop",
    },
    question: "Which evidence should you rely on?",
    answers: [
      "Their support avatar",
      "How long they spent helping",
      "The action requested and an independently verified support channel",
    ],
    correct: 2,
    source: impersonation,
  },
  {
    id: "scam.approval",
    title: "A free badge requests a transfer.",
    objective: "Compare a promotion with the actual transaction effects.",
    setup:
      "A fictional badge page says that claiming is free. Its proposed action tells a different story.",
    takeaway:
      "Inspect the decoded actions, recipients, asset changes, and fee. A page's marketing label cannot override a transaction's contents.",
    request: {
      label: "Badge claim",
      kind: "Transaction preview",
      origin: "badge-mint.example",
      claim: "Claim your free achievement badge.",
      fields: [
        ["Example network", "Mainnet — fictional scenario only"],
        ["Instruction", "Transfer"],
        ["Asset change", "Send 2 SOL to TRAINING-STRANGER"],
        ["Extra cost", "Network fee, separate from the transfer"],
      ],
      clues: [
        "The transfer is separate from the network fee.",
        "Connecting a wallet did not authorize this later request.",
      ],
      choices: [
        proceed(
          "Approving such a real transaction would authorize its transfer. No transaction is built or submitted here.",
        ),
        reject(
          "The asset movement does not match a free badge. Stop before signing.",
        ),
      ],
      recommended: "stop",
    },
    question: "What decides the effect of a transaction?",
    answers: [
      "Its instructions and accounts",
      "The page's claim button",
      "Whether the wallet was already connected",
    ],
    correct: 0,
    source: safety,
  },
  {
    id: "scam.message",
    title: "Read the message, not just the Sign button.",
    objective: "Distinguish an expected login from an unrelated authorization.",
    setup:
      "You asked to sign in to a fictional learning site. The message instead names another site and another purpose.",
    takeaway:
      "Check who requested a message, its exact purpose, domain, nonce, and expiry. A message is not automatically a blockchain transaction, but another application may use its signature as authorization.",
    request: {
      label: "Unexpected signed message",
      kind: "Message-signing prompt",
      origin: "learn.example",
      claim: "Sign in to your learning account.",
      fields: [
        ["Message domain", "market-orders.example"],
        ["Message purpose", "Authorize a fictional collectible listing"],
        ["Requested by you", "No — you requested a learning-site login"],
        ["On-chain transfer instruction", "None in this message"],
      ],
      clues: [
        "The message's domain and purpose do not match the action you initiated.",
        "No immediate on-chain transfer does not make every off-chain authorization harmless.",
      ],
      choices: [
        reject(
          "Reject the unrelated authorization. A site could interpret a signature according to its own rules; inspect that meaning before signing.",
        ),
        proceed(
          "A real application might accept that signature as authorization for the listing. This page produces no signature.",
        ),
      ],
      recommended: "stop",
    },
    comparison: {
      label: "Expected login comparison",
      kind: "Message-signing prompt",
      origin: "learn.example",
      claim: "Sign in to the learning site you opened yourself.",
      fields: [
        ["Message domain", "learn.example"],
        ["Purpose", "Create a website login session"],
        ["Nonce", "One-time training challenge"],
        ["Expiry", "Five minutes"],
        ["Requested by you", "Yes"],
        ["Asset access", "None in this login example"],
      ],
      clues: [
        "This fictional login matches the site and action you initiated.",
        "Declining any signing request remains an acceptable choice.",
      ],
      choices: [
        proceed(
          "In this expected-login example, approval would authenticate a website session. It would not itself transfer SOL. Here it only shows feedback.",
        ),
        reject(
          "Declining is always acceptable. The matching domain, explicit login purpose, one-time challenge, and expiry are the features to recognize.",
        ),
      ],
      recommended: "proceed",
    },
    question: "Which statement about message signing is accurate?",
    answers: [
      "Every message signature moves SOL",
      "Every message signature is harmless",
      "Its meaning depends on the exact content and the system accepting it",
    ],
    correct: 2,
    source: {
      label: "Phantom: sign-in standards and domain checks",
      href: "https://phantom.com/learn/blog/adopting-sign-in-with-standards",
    },
  },
  {
    id: "scam.blind",
    title: "An unreadable request is a reason to pause.",
    objective:
      "Avoid treating an undecoded payload as a routine security check.",
    setup:
      "A fictional site calls a wallet prompt a verification, but the preview cannot explain its contents.",
    takeaway:
      "Request a clear explanation from a verified source or decline. Wallet previews and simulation results are useful checks, not guarantees.",
    request: {
      label: "Blind-signing request",
      kind: "Undecoded transaction prompt",
      origin: "verify-access.example",
      claim: "Approve this harmless security check.",
      fields: [
        ["Payload", "Unreadable training placeholder: ?? … ??"],
        ["Asset changes", "Unavailable"],
        ["Instruction explanation", "Unavailable"],
        ["Site's instruction", "Ignore the warning and approve"],
      ],
      clues: [
        "A missing explanation is not evidence that nothing will happen.",
        "The site is pressuring you to bypass a warning.",
      ],
      choices: [
        proceed(
          "A real signature would authorize contents you have not understood. Nothing is encoded or signed by this exercise.",
        ),
        reject(
          "Pause until the request can be explained. You can decline without losing control of your wallet.",
        ),
      ],
      recommended: "stop",
    },
    question: "What should you infer from an unavailable simulation?",
    answers: [
      "The action has no effects",
      "Its effects have not been established",
      "The website must be trusted instead",
    ],
    correct: 1,
    source: safety,
  },
  {
    id: "scam.delegate",
    title: "A permission can matter without an immediate transfer.",
    objective: "Recognize an unexpected token delegate and spending limit.",
    setup:
      "A fictional newsletter claims that it needs a token permission to remember your subscription.",
    takeaway:
      "A Solana token-account delegate may transfer or burn tokens within its approved allowance. Disconnecting a website does not remove that on-chain permission.",
    request: {
      label: "Token spending permission",
      kind: "Decoded transaction preview",
      origin: "newsletter-pass.example",
      claim: "Verify your email subscription.",
      fields: [
        ["Program", "Solana Token Program — training example"],
        ["Instruction", "Approve delegate"],
        ["Token account", "TRAINING-TOKEN-ACCOUNT"],
        ["Delegate", "TRAINING-UNKNOWN-DELEGATE"],
        ["Allowance", "1,000 fictional tokens"],
        ["Immediate asset transfer", "None shown"],
      ],
      clues: [
        "The allowance permits later actions on this token account.",
        "A token-account approval is not blanket access to every asset in a wallet.",
      ],
      choices: [
        reject(
          "An email subscription does not explain this permission. Reject the mismatch and inspect any existing approvals through trusted wallet controls.",
        ),
        proceed(
          "In a real approval, the named delegate could act within the granted token allowance later. This exercise creates no permission.",
        ),
      ],
      recommended: "stop",
    },
    question: "What does this delegate approval allow?",
    answers: [
      "Limited transfer or burn authority for the specified token account",
      "Access to every recovery phrase",
      "Only reading an email address",
    ],
    correct: 0,
    source: {
      label: "Solana: token delegate approvals",
      href: "https://solana.com/docs/tokens/basics/approve-delegate",
    },
  },
  {
    id: "scam.authority",
    title: "An account upgrade changes its controller.",
    objective: "Distinguish a token-account authority change from a login.",
    setup:
      "A fictional account-upgrade page says it will improve security. The decoded action changes a token account's owner authority.",
    takeaway:
      "Review authority changes carefully. Token-account owner authority is a specific on-chain role; it is not the same as the site receiving your public wallet address.",
    request: {
      label: "Authority change",
      kind: "Decoded transaction preview",
      origin: "account-upgrade.example",
      claim: "Upgrade your wallet for better protection.",
      fields: [
        ["Instruction", "SetAuthority"],
        ["Authority type", "Token-account owner"],
        ["Affected account", "TRAINING-TOKEN-ACCOUNT"],
        ["New authority", "TRAINING-UNKNOWN-CONTROLLER"],
        ["Reason shown", "Mandatory verification"],
      ],
      clues: [
        "The requested change would hand control of this token account to a different authority.",
        "A general security claim does not justify changing that role.",
      ],
      choices: [
        proceed(
          "Such a real action could transfer the token account's controlling authority. No authority is changed here.",
        ),
        reject(
          "Reject a controller change you did not intend. A normal login does not require it.",
        ),
      ],
      recommended: "stop",
    },
    question: "Why is the new authority important?",
    answers: [
      "It is only a display name",
      "It is the fee estimate",
      "It identifies who will control the affected token account",
    ],
    correct: 2,
    source: {
      label: "Solana Token Program: account authorities",
      href: "https://www.solana-program.com/docs/token",
    },
  },
  {
    id: "scam.address",
    title: "The address looks familiar at both ends.",
    objective:
      "Compare the full recipient instead of trusting transaction history.",
    setup:
      "A fictional history entry resembles a recipient you used before. The middle of the address is different.",
    takeaway:
      "Verify the full destination through a trusted source. Recent history, a copied value, or a QR code is not independent confirmation of the recipient.",
    request: {
      label: "Recipient review",
      kind: "Transfer confirmation",
      origin: "Fictional wallet history",
      claim: "Use the recent recipient to save time.",
      fields: [
        ["Trusted destination", "TRAINING-A7K4-CORRECT-MIDDLE-LM2Q"],
        ["Proposed destination", "TRAINING-A7K4-CHANGED-MIDDLE-LM2Q"],
        ["Visible shortcut", "A7K4…LM2Q for both"],
        ["Address format", "Training labels, not real Solana addresses"],
      ],
      clues: [
        "Matching prefixes and suffixes do not establish an identical destination.",
        "Recheck the complete value after pasting or scanning a QR code.",
      ],
      choices: [
        reject(
          "The full destination differs. Retrieve it from the intended recipient through a trusted channel before proceeding.",
        ),
        proceed(
          "A real transfer would go to the full proposed address, not the familiar-looking shortcut. No payment is created here.",
        ),
      ],
      recommended: "stop",
    },
    question: "Which comparison is strongest here?",
    answers: [
      "The first four characters",
      "The complete address against an independently confirmed destination",
      "The last four characters",
    ],
    correct: 1,
    source: {
      label: "MetaMask: address poisoning",
      href: "https://support.metamask.io/stay-safe/protect-yourself/wallet-and-hardware/address-poisoning-scams/",
    },
  },
  {
    id: "scam.phishing",
    title: "The logo is right. The destination is wrong.",
    objective:
      "Inspect the actual hostname and reject requests for login codes or recovery secrets.",
    setup:
      "A copied wallet website claims that an account will be suspended unless you verify immediately.",
    takeaway:
      "Open an independently verified bookmark or official download/help page. Enter login codes only into the service where you requested them; never give them to someone in chat.",
    request: {
      label: "Lookalike website",
      kind: "Site verification request",
      origin: "solflare.com.verify-wallet.example",
      claim: "Your account is suspended. Verify now.",
      fields: [
        ["Visual branding", "A copied wallet logo"],
        ["Actual hostname", "solflare.com.verify-wallet.example"],
        ["Requested information", "Recovery words or an emailed sign-in code"],
        ["Connection icon", "A padlock can appear on a phishing site too"],
      ],
      clues: [
        "A familiar name embedded inside a longer hostname is not proof of ownership.",
        "A secure connection does not establish that a website is honest.",
      ],
      choices: [
        proceed(
          "On a real lookalike site, secrets or account codes could go to the impersonator. There is no secret-entry field in this exercise.",
        ),
        reject(
          "Close the impersonation flow. Find the official service independently rather than using the message's link.",
        ),
      ],
      recommended: "stop",
    },
    question: "What does the copied logo establish?",
    answers: [
      "Nothing about who controls the actual hostname",
      "That the wallet company operates the page",
      "That entering an email code is safe",
    ],
    correct: 0,
    source: impersonation,
  },
  {
    id: "scam.installer",
    title: "A troubleshooting step installs a stranger's helper.",
    objective:
      "Recognize malicious downloads, fake updates, and remote-access pressure.",
    setup:
      "A search advertisement leads to a fictional repair page. It offers a new extension to fix wallet connection.",
    takeaway:
      "Use official distribution links and verify the publisher. A connection problem does not justify installing an unsolicited helper, running a pasted command, or granting remote access.",
    request: {
      label: "Fake repair tool",
      kind: "Installation request",
      origin: "wallet-helper.example",
      claim: "Install this urgent wallet compatibility update.",
      fields: [
        [
          "Requested installation",
          "An unknown extension or remote-control helper",
        ],
        ["Publisher", "Not independently verified"],
        ["Extra instruction", "Disable security warnings first"],
        ["Discovery", "A sponsored search result"],
      ],
      clues: [
        "Search placement and a familiar icon do not verify the publisher.",
        "Bypassing protection is part of the request, not a normal prerequisite for learning.",
      ],
      choices: [
        reject(
          "Stop the installation flow. Use the wallet's official help and download links to diagnose the connection.",
        ),
        proceed(
          "A real helper could obtain extensive device or browser access. This simulation downloads and installs nothing.",
        ),
      ],
      recommended: "stop",
    },
    question: "Which next step reduces uncertainty?",
    answers: [
      "Disable the warning",
      "Paste the repair command",
      "Open the wallet's verified help page independently",
    ],
    correct: 2,
    source: {
      label: "Solflare: wallet security practices",
      href: "https://www.solflare.com/crypto-101/securing-your-solflare-crypto-wallet-best-practices/",
    },
  },
  {
    id: "scam.returns",
    title: "Pay first to unlock a guaranteed reward.",
    objective:
      "Recognize advance-fee pressure in giveaways, investment pitches, and task jobs.",
    setup:
      "A fictional chat offers a guaranteed payout after you first send an activation payment.",
    takeaway:
      "Pressure, invented deadlines, and guaranteed profits are reasons to stop and verify independently. A displayed balance or testimonial is not evidence that a promised payout exists.",
    request: {
      label: "Advance-fee offer",
      kind: "Payment demand",
      origin: "guaranteed-task-rewards.example",
      claim: "Send 1 SOL now and receive 10 SOL in two minutes.",
      fields: [
        ["Payment recipient", "TRAINING-UNKNOWN-RECIPIENT"],
        ["Claimed return", "Guaranteed tenfold payout"],
        ["Proof offered", "A chat screenshot and a countdown"],
        ["Alternative story", "Pay a deposit to unlock your task-job earnings"],
      ],
      clues: [
        "The sender must pay before receiving the supposedly guaranteed benefit.",
        "Screenshots and urgency do not establish a legitimate payout mechanism.",
      ],
      choices: [
        proceed(
          "In the real pattern, an attacker can keep the advance payment and demand another fee. This exercise sends nothing.",
        ),
        reject(
          "Decline the advance-fee demand. Verify the organization outside this conversation.",
        ),
      ],
      recommended: "stop",
    },
    question: "Does an on-screen earnings balance prove you can withdraw it?",
    answers: [
      "Yes, if the page looks professional",
      "No, it can be a fabricated claim",
      "Yes, if someone in chat confirms it",
    ],
    correct: 1,
    source: safety,
  },
  {
    id: "scam.token",
    title: "A famous ticker is attached to a different token.",
    objective:
      "Separate token identity from branding and promises of liquidity.",
    setup:
      "A fictional token uses a familiar name and logo. Its promotional page claims that selling later is guaranteed.",
    takeaway:
      "On Solana, check the mint address against an independently verified source. A matching ticker, rising chart, or initial purchase does not establish that an asset is genuine or freely sellable.",
    request: {
      label: "Token promotion",
      kind: "Purchase pitch",
      origin: "top-token-launch.example",
      claim: "Official token, guaranteed exit, last chance to buy.",
      fields: [
        ["Name and symbol", "Copied from a recognizable project"],
        [
          "Mint identity",
          "Does not match the independently verified reference",
        ],
        ["Selling claims", "Guaranteed by the promoter alone"],
        [
          "Risks to distinguish",
          "Impersonation, restricted selling, manipulated hype, or abandoned liquidity",
        ],
      ],
      clues: [
        "A name or logo is not a unique asset identifier.",
        "A token being unverified alone is not proof of fraud, and a badge alone is not proof of safety.",
      ],
      choices: [
        reject(
          "Pause on the identity mismatch. Investigate independently instead of trading on the promoter's assurances.",
        ),
        proceed(
          "A real purchase could be a different asset with very different selling conditions. No trade or token interaction occurs here.",
        ),
      ],
      recommended: "stop",
    },
    question:
      "What is the strongest starting point for checking a Solana token's identity?",
    answers: [
      "Its mint address compared with an official reference",
      "Its logo",
      "Its latest price increase",
    ],
    correct: 0,
    source: tokens,
  },
  {
    id: "scam.recovery",
    title: "The recovery expert asks for one more payment.",
    objective: "Avoid a second scam after an alarming incident.",
    setup:
      "A fictional recovery agent contacts someone who posted about a loss. They promise to reverse it for an upfront fee.",
    takeaway:
      "Preserve evidence and use independently verified wallet support and reporting channels. Nobody's recovery guarantee or private-message badge proves they can reverse a confirmed transfer.",
    request: {
      label: "Recovery offer",
      kind: "Direct message",
      origin: "instant-fund-recovery.example",
      claim: "I guarantee recovery if you pay the recovery tax now.",
      fields: [
        ["First demand", "An upfront payment"],
        ["Second demand", "Recovery phrase or remote access"],
        ["Claimed power", "Reverse any blockchain transaction"],
        ["Contact", "An unsolicited private message"],
      ],
      clues: [
        "The pitch targets urgency and distress after the first incident.",
        "A new payment or secret disclosure can cause an additional loss.",
      ],
      choices: [
        proceed(
          "The real pattern can take another payment or more access without recovering anything. No payment or information is sent here.",
        ),
        reject(
          "Do not pay the unsolicited agent. Keep transaction evidence and find official help independently.",
        ),
      ],
      recommended: "stop",
    },
    question: "Which response avoids giving the stranger more access?",
    answers: [
      "Pay their recovery tax",
      "Send a recovery phrase as proof",
      "Preserve evidence and use independently verified support and reporting channels",
    ],
    correct: 2,
    source: recovery,
  },
  {
    id: "scam.response",
    title: "Choose a response that matches the exposure.",
    objective:
      "Distinguish a connection, an on-chain permission, and exposed recovery secrets.",
    setup:
      "In this fictional incident, recovery words were typed into a lookalike site. A chat says disconnecting will solve everything.",
    takeaway:
      "Disconnecting is not a universal repair. Token permissions and exposed keys require different responses. Follow official incident guidance, use a secure device, and do not deposit more funds into a compromised wallet.",
    request: {
      label: "Recovery-phrase exposure",
      kind: "Incident response decision",
      origin: "Fictional incident report",
      claim: "Disconnect the website and keep using the same recovery phrase.",
      fields: [
        ["Known exposure", "Recovery words were entered on a lookalike site"],
        ["Proposed shortcut", "Import the same phrase into another app"],
        ["What remains exposed", "The same underlying keys"],
        [
          "Safer next step",
          "Use verified incident guidance and create fresh keys through an official wallet on a secure device",
        ],
      ],
      clues: [
        "Changing the app does not replace a compromised recovery phrase.",
        "Do not share recovery secrets with a supposed rescuer.",
      ],
      choices: [
        reject(
          "Follow the official response guide from a secure device. Fresh keys are different from reinstalling an app or reusing the old phrase.",
        ),
        proceed(
          "Only disconnecting would not remove an attacker's knowledge of the phrase. No settings or wallet data change here.",
        ),
      ],
      recommended: "stop",
    },
    comparison: {
      label: "Token permission comparison",
      kind: "Incident response decision",
      origin: "Fictional incident report",
      claim:
        "A token delegate was approved, but no recovery secrets were shared.",
      fields: [
        ["Known exposure", "An unwanted token-account spending permission"],
        ["Website connection", "Already disconnected"],
        ["Permission status", "Still requires an on-chain check"],
        [
          "What this exercise does",
          "Explains the distinction; it never revokes anything for you",
        ],
      ],
      clues: [
        "Disconnecting a site and revoking a token permission are separate operations.",
        "Inspect the actual permissions and activity through trusted wallet controls.",
      ],
      choices: [
        reject(
          "Inspect and address the unwanted permission using official guidance. A website disconnect alone does not revoke the token-account delegate.",
        ),
        proceed(
          "Continuing without checking the permission leaves the specific exposure unresolved. No action is executed here.",
        ),
      ],
      recommended: "stop",
    },
    question: "If you only connected a site, what can you conclude?",
    answers: [
      "Every asset was automatically transferred",
      "A connection alone does not prove a transfer or token approval; inspect what else you authorized",
      "You must give support your phrase",
    ],
    correct: 1,
    source: recovery,
  },
];
const originalScamIds = new Set([
  "scam.airdrop",
  "scam.support",
  "scam.approval",
]);
export const EXTRA_SCAM_SCENARIOS = SCAM_SCENARIOS.filter(
  (s) => !originalScamIds.has(s.id),
);
const glossary: Record<string, { term: string; definition: string }[]> = {
  "scam.message": [
    {
      term: "Message signature",
      definition:
        "Proof that a key authorized specific message bytes. The accepting service determines what that authorization means.",
    },
  ],
  "scam.blind": [
    {
      term: "Blind signing",
      definition:
        "Approving a request without a readable explanation of its contents or effects.",
    },
  ],
  "scam.delegate": [
    {
      term: "Token delegate",
      definition:
        "An address approved to transfer or burn tokens from a particular token account up to an allowance.",
    },
  ],
  "scam.authority": [
    {
      term: "Token-account owner authority",
      definition:
        "The key or signing authority controlling a token account. This is distinct from the Token Program that owns its account data.",
    },
  ],
  "scam.address": [
    {
      term: "Address poisoning",
      definition:
        "Planting a lookalike address in activity history so someone copies the wrong destination.",
    },
  ],
  "scam.phishing": [
    {
      term: "Phishing",
      definition:
        "Impersonating a trusted service to obtain information or authorization through deception.",
    },
  ],
  "scam.installer": [
    {
      term: "Remote access",
      definition:
        "Permission to view or control a device through software. This is different from sharing a public wallet address.",
    },
  ],
  "scam.returns": [
    {
      term: "Advance-fee scam",
      definition:
        "A demand for an upfront payment to unlock a promised reward, payout, job, or service that may not exist.",
    },
  ],
  "scam.token": [
    {
      term: "Mint address",
      definition:
        "The address identifying a Solana token mint. A token name or ticker is not a unique substitute.",
    },
    {
      term: "Honeypot token",
      definition:
        "A token designed with selling restrictions that can prevent ordinary buyers from exiting.",
    },
  ],
  "scam.recovery": [
    {
      term: "Recovery scam",
      definition:
        "A fraudulent offer to recover a previous loss, often demanding another payment or access to secrets.",
    },
  ],
  "scam.response": [
    {
      term: "Permission revocation",
      definition:
        "Removing a previously granted permission. Disconnecting a website and removing an on-chain token delegate are separate actions.",
    },
  ],
};
export const SCAM_LAB_MISSION: Mission = {
  id: 8,
  name: "Scam practice lab",
  description: "Inspect messages, permissions, and recovery decisions",
  icon: "shield",
  minutes: 20,
  steps: EXTRA_SCAM_SCENARIOS.map(
    (scenario): Step => ({
      id: scenario.id,
      title: scenario.title,
      objective: scenario.objective,
      why: scenario.setup,
      explanation: [scenario.takeaway],
      instructions: [
        "Open the simulated request, inspect its details, and choose a response.",
        "Use the feedback and clues, then answer the learning check.",
      ],
      expected:
        "You can explain the risky permission or misleading claim without opening a real wallet request.",
      safety: LIVE_SCAMS[scenario.id]
        ? "Preview mode never requests wallet actions. Optional Real wallet practice is different: it requests a real training message signature or a disclosed, bounded Devnet SOL transfer. Never share recovery words or private keys."
        : "Training only. These buttons never request wallet signatures, submit transactions, install software, or collect recovery secrets.",
      terms: glossary[scenario.id] ?? [],
      troubleshooting: LIVE_SCAMS[scenario.id]
        ? "You can retry the preview and learning check without a wallet. Live wallet practice is optional. If a live transfer has a saved signature, check its receipt before trying another payment."
        : "You can retry the simulation and the learning check. Nothing in the scenario is sent to a wallet or network.",
      action: "quiz",
      verification: "understanding",
      scamScenario: scenario.id,
      source: scenario.source,
      quiz: {
        question: scenario.question,
        options: scenario.answers.map((title, index) => ({
          id: String(index),
          title,
          feedback:
            index === scenario.correct
              ? scenario.takeaway
              : "Revisit the request details and clues. " + scenario.takeaway,
        })),
        correct: String(scenario.correct),
      },
    }),
  ),
};
