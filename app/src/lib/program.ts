import { Buffer } from 'buffer'
import {
  Connection,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { PROGRAM_ID, TRIGGER_MISSION_DISCRIMINATOR } from './constants'

export async function sendTriggerMission(
  connection: Connection,
  wallet: WalletContextState,
): Promise<string> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error('Connect a wallet first')
  }

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: false,
      },
    ],
    data: Buffer.from(TRIGGER_MISSION_DISCRIMINATOR) as Buffer,
  })

  const transaction = new Transaction().add(ix)
  const {
    context: { slot: minContextSlot },
    value: { blockhash, lastValidBlockHeight },
  } = await connection.getLatestBlockhashAndContext('confirmed')

  transaction.recentBlockhash = blockhash
  transaction.feePayer = wallet.publicKey

  const signature = await wallet.sendTransaction(transaction, connection, {
    minContextSlot,
  })

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed',
  )

  return signature
}
