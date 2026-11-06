export type Mood = 'idle' | 'happy' | 'thinking' | 'confused' | 'celebrate'

export type ActionType =
  | 'none'
  | 'link'
  | 'manual'
  | 'connect'
  | 'faucet'
  | 'cast'
  | 'flag'
  | 'finale'

export type CheckId =
  | 'none'
  | 'manual'
  | 'walletInstalled'
  | 'walletConnected'
  | 'balancePositive'
  | 'txConfirmed'
  | 'flagValid'

export type FairyLine = { mood: Mood; line: string }

export type Step = {
  id: string
  title: string
  body: string
  fairy: FairyLine
  action: ActionType
  check: CheckId
  /** Extra fields for action components */
  href?: string
  manualLabel?: string
  onPass?: FairyLine
  onFail?: Record<string, FairyLine>
}

export type Mission = {
  id: number
  name: string
  steps: Step[]
}

export const MISSIONS: Mission[] = [
  {
    id: 1,
    name: 'Get your wand',
    steps: [
      {
        id: '1.1',
        title: 'Meet Fairydev',
        body: 'Today you cast a spell on Solana. I hold the beer — you hold the wand (wallet).',
        fairy: {
          mood: 'happy',
          line: "Hi! I'm Fairydev, your fairy godfather. Today you cast a spell on Solana. I'll hold the beer.",
        },
        action: 'manual',
        check: 'manual',
        manualLabel: 'Start',
        onPass: {
          mood: 'happy',
          line: 'Wings ready. First stop: your wand.',
        },
      },
      {
        id: '1.2',
        title: 'Install Phantom',
        body: 'A wallet is a magic pouch (wallet) for your keys. Install Phantom, then refresh this page.',
        fairy: {
          mood: 'idle',
          line: 'A wallet is a magic pouch (wallet) for your keys. Phantom is the cutest one. Installed? Refresh, I’ll wait.',
        },
        action: 'link',
        check: 'walletInstalled',
        href: 'https://phantom.app/download',
        onPass: {
          mood: 'happy',
          line: 'I see the wand! Nice pouch.',
        },
        onFail: {
          missing: {
            mood: 'confused',
            line: 'Still no Phantom. Install it, then refresh this tab.',
          },
        },
      },
      {
        id: '1.3',
        title: 'Create a wallet',
        body: 'In Phantom: Create a new wallet → set a password. Come back when that screen is done.',
        fairy: {
          mood: 'idle',
          line: 'Click Create a new wallet and set a password. Easy peasy.',
        },
        action: 'manual',
        check: 'manual',
        manualLabel: 'I created my wallet',
      },
      {
        id: '1.4',
        title: 'Save the phrase',
        body: 'Write your Secret Recovery Phrase on paper. Never type it into any website — including mine.',
        fairy: {
          mood: 'idle',
          line: 'These words are your whole kingdom (Secret Recovery Phrase). Paper only. Never type them into any website, even mine.',
        },
        action: 'manual',
        check: 'manual',
        manualLabel: 'I wrote it down offline',
      },
      {
        id: '1.5',
        title: 'Connect',
        body: 'Show me your wand — connect Phantom to this page.',
        fairy: {
          mood: 'happy',
          line: 'Now show me your wand!',
        },
        action: 'connect',
        check: 'walletConnected',
        onPass: {
          mood: 'celebrate',
          line: 'Connected! Your wand knows this stage.',
        },
      },
    ],
  },
  {
    id: 2,
    name: 'Practice pond',
    steps: [
      {
        id: '2.1',
        title: 'Switch to Devnet',
        body: 'In Phantom: Settings → Developer Settings → Testnet Mode → Solana Devnet. Fake coins, real splash.',
        fairy: {
          mood: 'idle',
          line: 'Devnet is a practice pond (test network): the coins are fake, the splash is real.',
        },
        action: 'manual',
        check: 'manual',
        manualLabel: 'I switched to Devnet',
        onPass: {
          mood: 'happy',
          line: 'Good. Practice pond unlocked.',
        },
      },
    ],
  },
  {
    id: 3,
    name: 'Fairy dust',
    steps: [
      {
        id: '3.1',
        title: 'Get dust',
        body: 'Copy your address, open the fountain (faucet), request Devnet SOL. Wait until your balance is above zero.',
        fairy: {
          mood: 'idle',
          line: 'Fairy dust (devnet SOL) pays for spells (fees). Copy your address, open the fountain (faucet).',
        },
        action: 'faucet',
        check: 'balancePositive',
        href: 'https://faucet.solana.com/',
        onPass: {
          mood: 'happy',
          line: 'Dust acquired! Spells are on the menu.',
        },
        onFail: {
          zero: {
            mood: 'confused',
            line: 'Still 0 ✨. Dust takes a few seconds. Or the fountain is shy — try again in a bit.',
          },
        },
      },
    ],
  },
  {
    id: 4,
    name: 'Cast the spell',
    steps: [
      {
        id: '4.1',
        title: 'What is a spell',
        body: 'A transaction is a spell (transaction) you sign with your wand. A pinch of dust pays for it.',
        fairy: {
          mood: 'idle',
          line: 'A transaction is a spell (transaction) you sign with your wand. A pinch of dust pays for it.',
        },
        action: 'none',
        check: 'none',
      },
      {
        id: '4.2',
        title: 'Cast it',
        body: 'Press the button. Your wallet will ask permission — say yes.',
        fairy: {
          mood: 'happy',
          line: 'Press the button. Your wallet will ask permission. Say yes.',
        },
        action: 'cast',
        check: 'txConfirmed',
        onPass: {
          mood: 'celebrate',
          line: 'Boom — spell landed on-chain!',
        },
        onFail: {
          rejected: {
            mood: 'confused',
            line: 'You said no in the wallet. Totally fair, but I need a yes.',
          },
          insufficient: {
            mood: 'confused',
            line: 'Out of dust! Back to the fountain.',
          },
          network: {
            mood: 'confused',
            line: 'Wrong pond! Switch your wallet to Devnet.',
          },
          unknown: {
            mood: 'confused',
            line: 'The spell fizzled. Try again — or check Devnet and dust.',
          },
        },
      },
      {
        id: '4.3',
        title: 'Get the receipt',
        body: 'This receipt is your spell’s ID (transaction signature). Keep it — you’ll need it in the crystal ball.',
        fairy: {
          mood: 'happy',
          line: "This receipt is your spell's ID (transaction signature). Keep it!",
        },
        action: 'none',
        check: 'none',
      },
    ],
  },
  {
    id: 5,
    name: 'Crystal ball',
    steps: [
      {
        id: '5.1',
        title: 'Open Explorer',
        body: 'Open your transaction in Solana Explorer (Devnet). Scroll to Program Instruction Logs and find CTF{...}.',
        fairy: {
          mood: 'idle',
          line: 'Time for the crystal ball (block explorer). Open the receipt and hunt the lost wing in the logs.',
        },
        action: 'link',
        check: 'manual',
        manualLabel: 'I found CTF{...} in the logs',
        href: undefined, // filled from signature at runtime
        onPass: {
          mood: 'happy',
          line: 'You peeked into the chain. Paste the wing next.',
        },
      },
    ],
  },
  {
    id: 6,
    name: 'Return the wing',
    steps: [
      {
        id: '6.1',
        title: 'Submit the flag',
        body: 'Paste the full CTF{...} string from the program logs.',
        fairy: {
          mood: 'idle',
          line: 'Paste the wing here.',
        },
        action: 'flag',
        check: 'flagValid',
        onPass: {
          mood: 'celebrate',
          line: 'That’s the lost wing! You read the chain like a pro.',
        },
        onFail: {
          invalid: {
            mood: 'confused',
            line: 'Not quite. Copy the full CTF{...} from Program Instruction Logs.',
          },
        },
      },
      {
        id: '6.2',
        title: 'Certified by Fairydev',
        body: 'You learned: wallet, Devnet, transaction, signature, and program logs. Wings earned.',
        fairy: {
          mood: 'celebrate',
          line: 'You did it! You read the chain like a pro.',
        },
        action: 'finale',
        check: 'none',
      },
    ],
  },
]

export function flattenSteps(missions: Mission[] = MISSIONS): Step[] {
  return missions.flatMap((m) => m.steps)
}

export function findStepIndex(stepId: string): number {
  return flattenSteps().findIndex((s) => s.id === stepId)
}
