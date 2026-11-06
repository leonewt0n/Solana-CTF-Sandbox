import { FLAG_HASH_HEX } from './constants'

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Normalize user input and compare against the SHA-256 of the real flag. */
export async function verifyFlag(input: string): Promise<boolean> {
  const normalized = input.trim()
  const data = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(digest) === FLAG_HASH_HEX
}
