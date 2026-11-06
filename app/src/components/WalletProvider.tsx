import { createSolanaClient } from '@metamask/connect-solana'
import { useEffect, useMemo, type ReactNode } from 'react'
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { DEVNET_RPC } from '../lib/constants'

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = DEVNET_RPC
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    [],
  )

  useEffect(() => {
    // Registers MetaMask with the Wallet Standard so it shows in the connect modal.
    void createSolanaClient({
      dapp: {
        name: 'Fairydev',
        url: window.location.origin,
      },
      api: {
        supportedNetworks: {
          devnet: DEVNET_RPC,
        },
      },
      analytics: { enabled: false },
    })
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
