// Content is separate from presentation so lessons can grow without changing the UI.
export type Step = {
  id: string;
  title: string;
  objective: string;
  why: string;
  instructions: string[];
  expected: string;
  safety?: string;
  terms: { term: string; definition: string }[];
  troubleshooting: string;
  action:
    | "install"
    | "manual"
    | "connect"
    | "faucet"
    | "transaction"
    | "receipt"
    | "explorer"
    | "flag"
    | "summary";
  verification: "self" | "wallet" | "rpc" | "answer" | "read";
  confirmLabel?: string;
  source?: { label: string; href: string };
};
export type Mission = {
  id: number;
  name: string;
  description: string;
  steps: Step[];
};
export const MISSIONS: Mission[] = [
  {
    id: 1,
    name: "Create your wallet",
    description: "Your starting point",
    steps: [
      {
        id: "1.1",
        title: "A wallet is your way into Solana.",
        objective:
          "Install a wallet and understand what it does before creating an account.",
        why: "Your funds and transaction records exist on the blockchain. A wallet manages the keys you use to access accounts and authorize actions. This course uses Phantom for setup; the practice app also supports other Solana wallets.",
        instructions: [
          "Open the official Phantom download page using the button below.",
          "Choose your browser extension or mobile app and check the publisher before installing.",
          "Return to this page after installation. On desktop, refresh if the extension is not detected. On mobile, open this site in Phantom’s in-app browser.",
        ],
        expected:
          "Phantom is available on your device. Installing it does not buy crypto or move funds.",
        safety:
          "Create a fresh practice wallet for this course. You do not need to buy SOL or connect a wallet containing real funds.",
        terms: [
          {
            term: "Wallet",
            definition:
              "An app that manages keys, displays account information, and asks you to authorize blockchain actions.",
          },
          {
            term: "Solana",
            definition:
              "The blockchain network used for the hands-on exercises in this course.",
          },
        ],
        troubleshooting:
          "Already have a Solana wallet? You can continue and use it at the connection step. This course explains Phantom setup, but does not require uninstalling or replacing another wallet.",
        action: "install",
        verification: "self",
        confirmLabel: "My wallet app is ready",
        source: {
          label: "Official Phantom download",
          href: "https://phantom.app/download",
        },
      },
      {
        id: "1.2",
        title: "Create a fresh practice wallet.",
        objective:
          "Create a wallet in Phantom and distinguish its local password from its recovery method.",
        why: "A separate practice wallet keeps learning activity separate from your everyday accounts. The password unlocks the wallet on this device; it is not the same thing as the recovery phrase.",
        instructions: [
          "Open Phantom and choose to create a new wallet. For this walkthrough, choose the recovery-phrase option.",
          "Follow the wallet’s setup prompts and create a strong password if prompted.",
          "Continue to the recovery instructions inside Phantom. Keep all passwords and recovery words inside the wallet setup process.",
        ],
        expected:
          "A new wallet is created inside Phantom. This site cannot check that you created it or see your password.",
        safety:
          "If you already use Phantom, keep your existing wallet intact. Follow the official guide to create a separate wallet; do not reset or uninstall your existing setup.",
        terms: [
          {
            term: "Password",
            definition:
              "Protects access to the wallet on this device. It does not replace your recovery phrase.",
          },
          {
            term: "Account",
            definition:
              "An on-chain address and its associated state. A wallet app can manage several accounts.",
          },
        ],
        troubleshooting:
          "Phantom offers different setup methods and screens can change. Use the official recovery-phrase setup guide below if your screen differs. If you choose another recovery method, learn its recovery process before continuing.",
        action: "manual",
        verification: "self",
        confirmLabel: "I created my practice wallet",
        source: {
          label: "Phantom wallet setup guide",
          href: "https://help.phantom.com/articles/45135465489555",
        },
      },
      {
        id: "1.3",
        title: "Know what to keep private.",
        objective:
          "Back up your recovery phrase and recognize the information you can share.",
        why: "Anyone with the recovery phrase can take control of the wallet. Your public address is different: you share it to receive funds, though it can reveal public account activity.",
        instructions: [
          "Follow Phantom’s backup prompts. Record the recovery phrase offline in the correct order and store it somewhere private.",
          "Complete the wallet’s backup check, if shown. Never paste the phrase into this course.",
          "Find your public Solana address using the wallet’s Receive or copy-address control. This is the address you will use later.",
        ],
        expected:
          "You have a private recovery backup and can identify your public address. Your acknowledgment here is self-confirmed; we never inspect your backup.",
        safety:
          "Never share recovery phrases or private keys with a site, support agent, or person offering rewards. Do not use screenshots, chat messages, or this app to store them.",
        terms: [
          {
            term: "Public address",
            definition:
              "Your shareable destination for receiving assets on the correct network. It is not a password.",
          },
          {
            term: "Recovery phrase",
            definition:
              "A set of words used to restore control of your wallet. Losing it can make recovery impossible; exposing it can expose your funds.",
          },
          {
            term: "Private key",
            definition:
              "A secret used to authorize actions for an account. Keep it private just like a recovery phrase.",
          },
        ],
        troubleshooting:
          "If you have not backed up or understood your recovery method, stay on this step and use the wallet’s official help. Nobody here needs to see the words to help you learn.",
        action: "manual",
        verification: "self",
        confirmLabel: "I saved my backup privately",
      },
    ],
  },
  {
    id: 2,
    name: "Connect your wallet",
    description: "Understand the connection",
    steps: [
      {
        id: "2.1",
        title: "Connect with understanding.",
        objective: "Let this practice app read your public address.",
        why: "Connecting identifies the account you want to use. It lets the app request actions, but does not by itself authorize a transfer. Review any additional request separately.",
        instructions: [
          "Select Connect wallet below and choose your wallet.",
          "Read the site and permissions in the wallet prompt. Connect only if they match this practice app.",
          "Check that the connected address belongs to your practice wallet. You can disconnect using the wallet menu.",
        ],
        expected:
          "Your public address appears in the practice panel. No transaction fee is needed just to connect.",
        safety:
          "Connection and signing are different actions. A familiar site or connected wallet is not a reason to approve every later request.",
        terms: [
          {
            term: "Connection",
            definition:
              "Permission to share the selected public account with a site and receive requests from it.",
          },
          {
            term: "Signature",
            definition:
              "A cryptographic authorization made using an account’s private key. Its meaning depends on the message or transaction being signed.",
          },
        ],
        troubleshooting:
          "If your wallet is missing, install it from its official source and refresh. On a phone, try opening this page inside the wallet browser. Reject unexpected requests and check the site address.",
        action: "connect",
        verification: "wallet",
      },
    ],
  },
  {
    id: 3,
    name: "Choose Devnet",
    description: "A safe place to practice",
    steps: [
      {
        id: "3.1",
        title: "Use a network made for practice.",
        objective:
          "Choose Solana Devnet in your wallet and understand why it matters.",
        why: "Devnet is a separate Solana network used for testing. Its test SOL has no real monetary value. The same public address can have different balances on Mainnet and Devnet.",
        instructions: [
          "In Phantom, open Settings and find Developer Settings.",
          "Enable Testnet Mode and choose Solana Devnet. Look for the testnet banner in your wallet.",
          "Confirm below after checking your wallet. This app uses Devnet RPC, but cannot directly inspect the network selected in your wallet’s interface.",
        ],
        expected:
          "Your wallet displays its testnet banner and Devnet balance. Your Mainnet funds have not moved.",
        safety:
          "Do not purchase test SOL. If a wallet prompt shows Mainnet or unexpected asset movements during this course, reject it and check your settings.",
        terms: [
          {
            term: "Mainnet",
            definition:
              "The production network where assets can have real value.",
          },
          {
            term: "Devnet",
            definition:
              "A separate test network. Its account history and balances are independent of Mainnet and may be reset.",
          },
        ],
        troubleshooting:
          "Menu names vary across wallet versions. Use the official testnet guide if needed. Other supported wallets have their own network controls.",
        action: "manual",
        verification: "self",
        confirmLabel: "I checked that my wallet uses Devnet",
        source: {
          label: "Phantom testnet guide",
          href: "https://help.phantom.com/articles/use-testnets-in-phantom-5997313271699",
        },
      },
    ],
  },
  {
    id: 4,
    name: "Receive test SOL",
    description: "Addresses, balances & fees",
    steps: [
      {
        id: "4.1",
        title: "Fund your first practice transaction.",
        objective: "Receive free Devnet SOL at your public address.",
        why: "Solana transactions need a fee paid in SOL, even when interacting with another token. A faucet distributes free test SOL so you can practice without buying anything.",
        instructions: [
          "Copy the public address shown below. Check that it matches your connected practice wallet.",
          "Open the Solana faucet, select Devnet if asked, and request test SOL for that address.",
          "Return here. We check the address on Devnet periodically and continue once its balance is greater than zero.",
        ],
        expected:
          "A positive Devnet SOL balance appears below. An existing positive balance also satisfies this check; it does not prove a new faucet request.",
        terms: [
          {
            term: "SOL",
            definition:
              "Solana’s native asset, used to pay network fees. Devnet SOL is its test-network counterpart.",
          },
          {
            term: "Lamport",
            definition:
              "The smallest unit of SOL. One SOL equals 1,000,000,000 lamports.",
          },
          {
            term: "Faucet",
            definition:
              "A service that provides limited amounts of test-network funds for development and learning.",
          },
        ],
        troubleshooting:
          "Faucets can be rate-limited and RPC services can be temporarily unavailable. Wait and retry later. Check the full address and Devnet selection. Never pay someone to unlock a faucet.",
        action: "faucet",
        verification: "rpc",
      },
    ],
  },
  {
    id: 5,
    name: "Make a transaction",
    description: "Inspect before you sign",
    steps: [
      {
        id: "5.1",
        title: "Review the action before approving.",
        objective:
          "Submit a small practice program call after inspecting its purpose and fee.",
        why: "A transaction contains instructions that a network executes after you sign. This one calls our teaching program, which writes a practice code into public logs. It does not contain a SOL transfer instruction; your wallet pays the network fee.",
        instructions: [
          "Read the transaction preview below: network, program address, intended action, and estimated network fee.",
          "Select Review in wallet. Inspect the wallet’s transaction details and simulation, if available.",
          "Approve only if the details match. Rejecting is always an acceptable choice; you can review again later.",
          "Wait for confirmation. A transaction ID alone does not prove that execution succeeded.",
        ],
        expected:
          "The program call succeeds on Devnet and a transaction signature is saved for the next lesson.",
        safety:
          "If you see an unexpected transfer, account change, network, or program, reject the request. Do not approve a request you cannot explain.",
        terms: [
          {
            term: "Transaction",
            definition:
              "One or more instructions submitted together to the network, authorized by signatures.",
          },
          {
            term: "Program",
            definition:
              "Code deployed on Solana that processes instructions. This course uses a small program that emits a log message.",
          },
          {
            term: "Network fee",
            definition:
              "SOL paid for processing a transaction. Failed transactions can also incur fees. The preview estimates the fee for this transaction; check your wallet before signing.",
          },
        ],
        troubleshooting:
          "Insufficient funds: return to Receive test SOL. Expired transaction: review a new request. RPC or program unavailable: wait and retry. If confirmation is uncertain, inspect the saved signature before sending again.",
        action: "transaction",
        verification: "rpc",
        source: {
          label: "Solana transaction fees",
          href: "https://solana.com/docs/core/fees",
        },
      },
    ],
  },
  {
    id: 6,
    name: "Read the receipt",
    description: "Verify on-chain evidence",
    steps: [
      {
        id: "6.1",
        title: "Find your transaction on the explorer.",
        objective:
          "Use the transaction signature to inspect what actually happened.",
        why: "An explorer displays blockchain records independently of the wallet interface. The transaction signature identifies your submitted transaction; its status and execution result tell you whether it succeeded.",
        instructions: [
          "Open your saved transaction using the Devnet explorer link below.",
          "Check that the result is successful. Compare the signer and invoked program with your wallet and the teaching program.",
          "Find Program Instruction Logs and locate the full text beginning with CTF{ and ending with }. It is a public exercise code, not a secret.",
        ],
        expected:
          "You can identify the transaction’s result, signer, program, and exercise code in its logs.",
        terms: [
          {
            term: "Transaction signature",
            definition:
              "A public transaction identifier you can use to look up a transaction. Sharing it can reveal linked public activity.",
          },
          {
            term: "Explorer",
            definition:
              "A site that presents network transactions and accounts in a readable format.",
          },
          {
            term: "Program logs",
            definition:
              "Messages produced while a program runs. They are public and should never contain private information.",
          },
        ],
        troubleshooting:
          "Not found? Make sure the explorer is set to Devnet and wait briefly for indexing. A failed transaction will not count as a successful program call. Return to the prior lesson to inspect or retry.",
        action: "explorer",
        verification: "self",
        confirmLabel: "I inspected the receipt and found the code",
      },
      {
        id: "6.2",
        title: "Check what you found.",
        objective:
          "Confirm you located the public exercise code in the transaction logs.",
        why: "This short check ties the walkthrough to the transaction you inspected. It checks the exercise code locally; it is not proof of wallet ownership or an independent audit of your activity.",
        instructions: [
          "Copy the complete CTF{...} code from the program logs.",
          "Paste only that exercise code below, including the braces.",
          "Check your answer. If it differs, revisit your transaction’s program logs.",
        ],
        expected: "The code matches the teaching program’s expected output.",
        terms: [
          {
            term: "CTF flag",
            definition:
              "A recognizable text answer in a Capture the Flag exercise. Here it is intentionally public so you can practice reading logs.",
          },
        ],
        troubleshooting:
          "Include the prefix, braces, and exact capitalization. Do not paste a recovery phrase, private key, or wallet password.",
        action: "flag",
        verification: "answer",
      },
    ],
  },
  {
    id: 7,
    name: "Your next steps",
    description: "Review what you practiced",
    steps: [
      {
        id: "7.1",
        title: "Your first steps, understood.",
        objective:
          "Review the skills you practiced and the checks behind your progress.",
        why: "The goal is to explain your actions, not just finish a checklist. Use the outline to revisit any lesson. You do not need to repeat the transaction to review it.",
        instructions: [
          "Explain which wallet information is safe to share and which must stay private.",
          "Describe the difference between connecting, signing, and submitting a transaction.",
          "Use your saved receipt to explain the network, outcome, and program logs.",
        ],
        expected:
          "You can explain the practice workflow in your own words. This is a learning summary, not a certification or guarantee of safety.",
        terms: [],
        troubleshooting:
          "You can revisit earlier lessons without losing progress. Restart clears only this course’s saved progress for the current account; it does not change the wallet or blockchain.",
        action: "summary",
        verification: "read",
      },
    ],
  },
];
export function flattenSteps(missions: Mission[] = MISSIONS): Step[] {
  return missions.flatMap((m) => m.steps);
}
