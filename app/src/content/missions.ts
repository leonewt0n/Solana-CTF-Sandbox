// Lesson copy is reviewed against the linked primary sources. No market-share or speed ranking is implied.
export type DiagramKind =
  | "records"
  | "journey"
  | "networks"
  | "uses"
  | "wallet"
  | "keys"
  | "fees"
  | "permissions"
  | "airdrop"
  | "support"
  | "approval"
  | "receipt";
export type QuizOption = { id: string; title: string; feedback: string };
export type Step = {
  id: string;
  title: string;
  objective: string;
  why: string;
  explanation?: string[];
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
    | "explorer"
    | "flag"
    | "quiz"
    | "summary";
  verification: "self" | "wallet" | "rpc" | "answer" | "understanding" | "read";
  confirmLabel?: string;
  source?: { label: string; href: string };
  diagram?: DiagramKind;
  quiz?: { question: string; options: QuizOption[]; correct: string };
};
export type Mission = {
  id: number;
  name: string;
  description: string;
  icon: string;
  minutes: number;
  steps: Step[];
};
export const MISSIONS: Mission[] = [
  {
    id: 1,
    name: "Why Web3?",
    description: "The idea behind the internet’s next chapter",
    icon: "globe",
    minutes: 6,
    steps: [
      {
        id: "web3.why",
        title: "Why did Web3 start?",
        objective: "Understand the problem before learning the technology.",
        why: "Imagine a game closes tomorrow. The company can switch off your account, inventory, and marketplace because it keeps the records. That is convenient while it works—but you depend on its rules.",
        explanation: [
          "Bitcoin’s 2008 proposal explored a way to send electronic cash without relying on a financial intermediary to maintain the payment record. Later programmable networks extended that idea to rules and digital assets.",
          "“Web3” is a broad name for apps using wallets and shared networks for some forms of coordination and ownership. It does not replace the whole internet. Ordinary apps and public blockchains solve different problems.",
          "A shared record can reduce dependence on one operator. It also brings public activity, fees, harder recovery, and responsibility for your keys. Some apps still depend heavily on companies and central services.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [
          {
            term: "Intermediary",
            definition:
              "A person or service that keeps a record or carries out a task between other parties.",
          },
          {
            term: "Web3",
            definition:
              "A broad term for applications built around wallets, blockchain networks, and related tools. Different projects provide different amounts of user control.",
          },
        ],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "records",
        quiz: {
          question:
            "Which situation could benefit from a shared public record?",
          options: [
            {
              id: "shared",
              title:
                "People transferring a digital asset across independent apps",
              feedback:
                "A shared record lets independent apps check the same ownership history, if those apps support the asset. It does not guarantee every app will accept it.",
            },
            {
              id: "private",
              title: "Writing a private shopping list",
              feedback:
                "A private list usually works better in a normal app. A public blockchain adds visibility, cost, and complexity without a clear benefit.",
            },
          ],
          correct: "shared",
        },
        source: {
          label: "Bitcoin’s original proposal",
          href: "https://bitcoin.org/bitcoin.pdf",
        },
      },
      {
        id: "web3.blockchain",
        title: "What is a blockchain, actually?",
        objective: "Follow one change from a request to a shared record.",
        why: "Picture a notebook copied across a network of computers. A transfer is a request to update that notebook. The network checks the request against its rules rather than accepting any change someone types.",
        explanation: [
          "A transaction is a request to perform actions. A digital signature proves that the relevant key authorized the request; it does not prove the request is wise or safe.",
          "Validators are computers that help check transactions and agree on the network’s history. Blocks group recorded activity, and cryptographic links make changes to earlier records detectable.",
          "Submitting is not the same as succeeding. A request may be rejected, expire, or execute with an error. Check the outcome rather than trusting a loading animation or a transaction ID alone.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [
          {
            term: "Blockchain",
            definition:
              "A ledger maintained under a network’s rules, with cryptographically linked records.",
          },
          {
            term: "Validator",
            definition:
              "A network participant that checks transactions and helps agree on history.",
          },
          {
            term: "Digital signature",
            definition:
              "Cryptographic evidence that a particular key authorized a specific message or transaction.",
          },
        ],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "journey",
        quiz: {
          question: "You have a transaction ID. What should you do next?",
          options: [
            {
              id: "done",
              title: "Assume the recipient has received the funds",
              feedback:
                "An ID identifies a request. It does not tell you whether the network executed the request successfully.",
            },
            {
              id: "check",
              title: "Check its network, result, recipient, and amount",
              feedback:
                "Yes. Those checks connect the identifier to what actually happened. A confirmed transaction can still have an execution error.",
            },
          ],
          correct: "check",
        },
        source: {
          label: "Solana: transactions",
          href: "https://solana.com/docs/core/transactions",
        },
      },
    ],
  },
  {
    id: 2,
    name: "Meet Solana",
    description: "Networks, tradeoffs, and real uses",
    icon: "layers",
    minutes: 7,
    steps: [
      {
        id: "solana.why",
        title: "Why are we learning on Solana?",
        objective: "Compare networks by their design and the task—not by hype.",
        why: "Solana is a programmable blockchain. We use it here because we can practice a complete wallet-to-explorer workflow on Devnet with free test funds. Learning one network carefully is easier than switching between several at once.",
        explanation: [
          "Solana’s runtime can execute independent transactions in parallel when their account access does not conflict. Think of separate checkout lanes: people using the same counter still need coordination.",
          "Solana introduced Proof of History, a verifiable way to order events alongside stake-based consensus. The details of network protocols evolve; the important distinction is that ordering events is not the same thing as agreeing on valid history.",
          "Bitcoin emphasizes its native monetary asset and payment ledger. Ethereum supports programmable applications and scales much activity through layer-2 networks. Solana runs applications on its own base network. Different designs bring different infrastructure, fee, and trust tradeoffs.",
          "No network wins every category. Fees and execution times vary, and all networks face operational risks. Validators have hardware requirements, applications can have bugs, and network performance does not make a token trustworthy.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [
          {
            term: "Program",
            definition:
              "Code on Solana that processes instructions; often called a smart contract on other networks.",
          },
          {
            term: "Layer 2",
            definition:
              "A network built to scale a base network. Designs differ, and extra bridges or operators can add assumptions.",
          },
        ],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "networks",
        quiz: {
          question: "What is the most useful question when choosing a network?",
          options: [
            {
              id: "fit",
              title:
                "Does it support my task, asset, wallet, and acceptable tradeoffs?",
              feedback:
                "Exactly. Check the whole workflow, including the destination network, fee asset, and services you depend on.",
            },
            {
              id: "fast",
              title: "Which one advertises the biggest speed number?",
              feedback:
                "A headline speed number can hide different measurement methods and workloads. It does not settle compatibility, safety, cost, or trust.",
            },
          ],
          correct: "fit",
        },
        source: {
          label: "Solana terminology and runtime",
          href: "https://solana.com/docs/references/terminology",
        },
      },
      {
        id: "web3.uses",
        title: "What do people use it for?",
        objective: "Recognize common uses—and the limitations behind them.",
        why: "You will encounter payments, token trading, collectibles, and apps that use a wallet as an account. These are examples of real product categories, not a ranking of adoption or a reason to invest.",
        explanation: [
          "Payments: people send native coins and stablecoins between accounts. A stablecoin aims to track something such as a dollar; it still has issuer, redemption, and network risks.",
          "Trading and decentralized finance: apps let users exchange assets or interact with lending and liquidity programs. Bugs, changing prices, scams, and liquidation can cause losses. This course does not ask you to trade.",
          "Collectibles and app access: tokens can represent a unique item or a membership check. A token does not automatically give copyright, a real-world claim, or access to every app.",
          "Public-network records are often visible. Using a wallet address does not make you anonymous, and putting data on a blockchain does not prove the data was true in the first place.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [
          {
            term: "Stablecoin",
            definition:
              "A token designed to track a reference value. Its price and redemption depend on the design and issuer.",
          },
          {
            term: "DeFi",
            definition:
              "Financial applications using on-chain programs, often alongside external interfaces and services.",
          },
          {
            term: "NFT",
            definition:
              "A token intended to identify a distinct item. The rights and usefulness of that item depend on more than the token itself.",
          },
        ],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "uses",
        quiz: {
          question:
            "A collectible token is in your wallet. What can you conclude?",
          options: [
            {
              id: "rights",
              title: "You automatically own the artwork’s copyright",
              feedback:
                "Token ownership and legal rights are different. Read the issuer’s terms and verify what the token actually represents.",
            },
            {
              id: "record",
              title:
                "The network records the token; its rights depend on the asset and terms",
              feedback:
                "Correct. Check the issuer, mint address, and terms. A familiar image or name alone is not proof of authenticity or useful rights.",
            },
          ],
          correct: "record",
        },
        source: {
          label: "Solana payment concepts",
          href: "https://solana.com/docs/payments/how-payments-work",
        },
      },
    ],
  },
  {
    id: 3,
    name: "Your first wallet",
    description: "Create it. Protect it. Understand it.",
    icon: "wallet",
    minutes: 8,
    steps: [
      {
        id: "1.1",
        title: "Create your first practice wallet.",
        objective:
          "Your wallet is a signing tool. Start with the official app and a fresh practice account.",
        why: "Your funds and transaction records exist on the blockchain. A wallet manages the keys you use to access accounts and authorize actions. Choose Phantom or Solflare for this course. The setup examples describe Phantom; Solflare users can follow the equivalent prompts inside their wallet.",
        instructions: [
          "Choose the official Phantom or Solflare download link below.",
          "Choose your browser extension or mobile app and check the publisher before installing.",
          "Return to this page after installation. On desktop, refresh if the extension is not detected. On mobile, open this site in your chosen wallet’s in-app browser.",
        ],
        expected:
          "Phantom or Solflare is available on your device. Installing it does not buy crypto or move funds.",
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
          "Already have a Solana wallet? You can continue and use it at the connection step. Phantom and Solflare are supported. The examples explain Phantom setup; follow your wallet’s own setup prompts without uninstalling or replacing an existing wallet.",
        action: "install",
        verification: "self",
        confirmLabel: "My wallet app is ready",
        source: {
          label: "Official Phantom download",
          href: "https://phantom.app/download",
        },
        diagram: "wallet",
        explanation: [
          "The coins are recorded on the network, not inside the app. Your wallet manages the keys that let you authorize changes to your accounts. Think of it as a keyring and control panel—not a bag of money.",
        ],
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
        explanation: [
          "This guide uses a recovery-phrase wallet so the backup process is explicit. Phantom also supports other setup methods. Follow the official guide if the screens on your device differ.",
        ],
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
        diagram: "keys",
      },
      {
        id: "security.share",
        title: "What is safe to share?",
        objective:
          "Separate your public address from the secrets that control it.",
        why: "Someone wants to send you test SOL. They need a receiving address on the correct network—not your password, private key, or recovery phrase.",
        explanation: [
          "A public address is a destination and a way to inspect account activity. You may share it to receive funds, but people may be able to connect it to public transactions.",
          "A wallet password protects the app on your device. The recovery phrase or private key can restore control of accounts. A stranger does not need any of these secrets to help you receive funds.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "keys",
        quiz: {
          question: "Which item should you send to receive test SOL?",
          options: [
            {
              id: "address",
              title: "My public Solana address",
              feedback:
                "Yes. Double-check the network and full address. Sharing it can reveal public activity, but it does not give someone the signing key.",
            },
            {
              id: "phrase",
              title: "My recovery phrase",
              feedback:
                "Never. Someone with the phrase can take control. Receiving funds requires only the correct public address.",
            },
          ],
          correct: "address",
        },
        source: {
          label: "Phantom: getting started",
          href: "https://help.phantom.com/articles/36482144712083",
        },
      },
    ],
  },
  {
    id: 4,
    name: "Get ready to transact",
    description: "Connection, networks, and test funds",
    icon: "coins",
    minutes: 7,
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
        diagram: "permissions",
      },
      {
        id: "3.1",
        title: "Use a network made for practice.",
        objective:
          "Choose Solana Devnet in your wallet and understand why it matters.",
        why: "Devnet is a separate Solana network used for testing. Its test SOL has no real monetary value. The same public address can have different balances on Mainnet and Devnet.",
        instructions: [
          "Open your wallet’s Settings. In Phantom, find Developer Settings; in Solflare, find Network.",
          "In Phantom, enable Testnet Mode and choose Solana Devnet. In Solflare, open Settings, find Network, and choose Devnet.",
          "Confirm below after checking your wallet. This app uses Devnet RPC, but cannot directly inspect the network selected in your wallet’s interface.",
        ],
        expected:
          "Your wallet shows that Devnet is selected and displays its Devnet balance. Your Mainnet funds have not moved.",
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
          "Menu names vary across wallet versions. Use the official testnet guide if needed. In Solflare, look for Network in Settings and select Devnet.",
        action: "manual",
        verification: "self",
        confirmLabel: "I checked that my wallet uses Devnet",
        source: {
          label: "Phantom testnet guide",
          href: "https://help.phantom.com/articles/use-testnets-in-phantom-5997313271699",
        },
        diagram: "networks",
      },
      {
        id: "fees.explain",
        title: "Why do I need SOL if I have USDC?",
        objective:
          "Understand the asset you send and the asset that pays the fee.",
        why: "Imagine your Solana account has 10 USDC and zero SOL. You may have enough USDC for the payment, but an ordinary transaction still needs SOL for the network fee.",
        explanation: [
          "USDC and SOL are different assets. The token being moved does not automatically pay the processing fee. Another party can sponsor some transactions, but this course uses your practice account as the fee payer.",
          "The same token name can appear on different networks. ETH on Ethereum does not pay a fee on Solana, and a Solana balance is not the same as a balance on an Ethereum layer 2.",
          "Devnet is separate from Mainnet. A faucet supplies free test SOL. Its balance is for practice, not something you can cash out. Fees are estimates until you review the actual request.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [
          {
            term: "Fee payer",
            definition: "The account charged for processing the transaction.",
          },
          {
            term: "Native asset",
            definition:
              "The network’s own asset, such as SOL on Solana or ETH on Ethereum.",
          },
        ],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "fees",
        quiz: {
          question:
            "You have USDC on Solana but no SOL. What is missing for an ordinary transfer?",
          options: [
            {
              id: "native",
              title: "SOL on the same network for the transaction fee",
              feedback:
                "Exactly. On Devnet, use the free faucet. You do not need to buy anything for this course.",
            },
            {
              id: "other",
              title: "Any coin with the same dollar value on any network",
              feedback:
                "Assets are not interchangeable just because their prices match. The fee payer needs the correct native asset on the correct network.",
            },
          ],
          correct: "native",
        },
        source: {
          label: "Solana fees",
          href: "https://solana.com/docs/core/fees",
        },
      },
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
        diagram: "fees",
      },
    ],
  },
  {
    id: 5,
    name: "Your first transaction",
    description: "Review, sign, and check the result",
    icon: "send",
    minutes: 4,
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
        diagram: "journey",
      },
    ],
  },
  {
    id: 6,
    name: "Spot the scam",
    description: "Practice the decisions that protect you",
    icon: "shield",
    minutes: 6,
    steps: [
      {
        id: "scam.airdrop",
        title: "The airdrop in your wallet.",
        objective:
          "Investigate an offer without treating its appearance as an endorsement.",
        why: "A token in a wallet can contain a promotional name or link. Anyone can create convincing-looking assets. Being visible inside a wallet does not make an offer official.",
        explanation: [
          "Our simulated message says: “You received 10 SOL. Visit sol-rewards.example to unlock it.” The .example address is a non-working training example; do not browse it.",
          "An urgent deadline, an unfamiliar destination, and a recovery-phrase request are warning signs. Stop and check the offer through an independently verified official source. Never provide secrets to claim a reward.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "airdrop",
        quiz: {
          question:
            "The claim page asks for your recovery phrase. What do you do?",
          options: [
            {
              id: "stop",
              title: "Close it and verify the claim through an official source",
              feedback:
                "Correct. Recovery words are not needed to receive a reward. Ignore or report the suspicious asset using the wallet’s controls.",
            },
            {
              id: "trust",
              title:
                "Enter the phrase because the message appeared in my wallet",
              feedback:
                "A wallet can display untrusted content. The phrase would give the recipient control of your accounts.",
            },
          ],
          correct: "stop",
        },
        source: {
          label: "Phantom: recognize common scams",
          href: "https://phantom.com/learn/crypto-101/common-crypto-scams",
        },
      },
      {
        id: "scam.support",
        title: "When “support” sends you a DM.",
        objective:
          "Recognize the risky request even when a person sounds helpful.",
        why: "A stranger spends time answering your questions, then offers to fix your wallet. Trust can build slowly, so evaluate the requested action—not just how friendly the person seems.",
        explanation: [
          "In this simulation, “Support” asks you to synchronize your wallet on a new site and type your recovery phrase. The risky request is the turning point; the earlier friendly messages do not make it safe.",
          "Do not use unsolicited links to find support. Open the wallet’s independently verified help page yourself. Legitimate troubleshooting does not require giving a person control of your keys.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "support",
        quiz: {
          question: "What is the first decisive red flag in this exchange?",
          options: [
            {
              id: "friendly",
              title: "They were friendly and explained a fee",
              feedback:
                "Being friendly is not proof of a scam or of safety. Focus on what access they are asking you to grant.",
            },
            {
              id: "secret",
              title: "They ask me to enter my recovery phrase on another site",
              feedback:
                "Exactly. Stop before revealing secrets, even if the person has helped you before.",
            },
          ],
          correct: "secret",
        },
        source: {
          label: "Phantom: recognize common scams",
          href: "https://phantom.com/learn/crypto-101/common-crypto-scams",
        },
      },
      {
        id: "scam.approval",
        title: "Read the request, not the promise.",
        objective:
          "Compare an app’s claim with the action it wants you to authorize.",
        why: "A page promises a free badge. The simulated request actually asks to send 0.5 SOL to an unfamiliar address. The label on the page and the effect of the transaction do not match.",
        explanation: [
          "A signature authorizes the contents of a particular request. A site name, a “claim” button, or a wallet connection does not prove that the request is harmless.",
          "Review the network, signer, recipient, asset changes, fees, and program. Wallet simulation can help, but a preview is not a guarantee. Reject a request you cannot explain.",
          "Messages are not automatically harmless either: some signatures can authorize actions in other systems. Read the exact content and purpose of every signing request.",
        ],
        instructions: [],
        expected:
          "Explain your choice in your own words, then continue when the check is complete.",
        terms: [],
        troubleshooting:
          "Explore the example above, then choose an answer. You can try again; mistakes here do not affect a wallet or move funds.",
        action: "quiz",
        verification: "understanding",
        diagram: "approval",
        quiz: {
          question:
            "The page says “free badge”; the request sends your SOL. What is the safe decision?",
          options: [
            {
              id: "reject",
              title:
                "Reject because the requested effect does not match the claim",
              feedback:
                "Correct. You have identified the mismatch before signing. In this exercise nothing is sent to a wallet or network.",
            },
            {
              id: "approve",
              title: "Approve because I already connected my wallet",
              feedback:
                "Connecting does not grant blanket permission. This new request must make sense on its own.",
            },
          ],
          correct: "reject",
        },
        source: {
          label: "Phantom: recognize common scams",
          href: "https://phantom.com/learn/crypto-101/common-crypto-scams",
        },
      },
    ],
  },
  {
    id: 7,
    name: "Follow the receipt",
    description: "Find the evidence in an explorer",
    icon: "search",
    minutes: 5,
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
        diagram: "receipt",
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
    id: 8,
    name: "Bring it together",
    description: "Review the skills you practiced",
    icon: "check",
    minutes: 2,
    steps: [
      {
        id: "7.1",
        title: "You can explain your next move.",
        objective: "A learning record, not a promise that every app is safe.",
        why: "You have explored why shared networks exist, compared Solana with other networks, practiced a Devnet workflow, and inspected simulated scams. The useful habit is to explain a request before approving it.",
        instructions: [
          "Explain when a shared public ledger helps—and when an ordinary app is a better fit.",
          "Identify the network, fee asset, signer, and intended effect before signing.",
          "Keep recovery secrets private and inspect a receipt rather than assuming a payment succeeded.",
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
