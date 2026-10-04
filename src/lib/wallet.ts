/**
 * The logged-in visitor's wallet, as the pages see it. `components/WalletProvider` fills
 * this in from Privy; everything else only reads it through `useWallet`.
 */
import { createContext, useContext } from 'react'
import type { Connection, PublicKey, Transaction } from '@solana/web3.js'

export type WalletInfo = {
  /** 'Privy' for the wallet made at login, else the wallet's own name (Phantom, Solflare, …). */
  name: string
  icon: string | null
  /** Made by Privy for this account, as opposed to the visitor's own wallet. */
  embedded: boolean
}

export type WalletState = {
  /** Privy has started up. Until then nobody counts as logged out yet. */
  ready: boolean
  /** Logged in, with a wallet that can sign. */
  connected: boolean
  /** Logged in, and the wallet is still being set up. */
  connecting: boolean
  publicKey: PublicKey | null
  wallet: WalletInfo | null
  /** How the visitor logged in: an email, a phone number or a wallet name. */
  identity: string | null
  /** Logged in with their own wallet, which is not connected in this browser right now. */
  needsWallet: boolean
  /** Opens the login window; for `needsWallet`, the window to connect that wallet again. */
  login: () => void
  logout: () => Promise<void>
  /** Shows the private key of a Privy-made wallet, in Privy's own window. Null for the visitor's own wallet. */
  exportKey: (() => Promise<void>) | null
  /** Adds this wallet's signature and leaves every other signature slot as it was. */
  signTransaction: (tx: Transaction) => Promise<Transaction>
  /** Signs, then broadcasts through `connection`. The wallet must be the fee payer. */
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>
}

const notReady = async () => { throw new Error('Log in first.') }
export const WalletContext = createContext<WalletState>({
  ready: false,
  connected: false,
  connecting: false,
  publicKey: null,
  wallet: null,
  identity: null,
  needsWallet: false,
  login: () => {},
  logout: async () => {},
  exportKey: null,
  signTransaction: notReady,
  sendTransaction: notReady,
})

export const useWallet = () => useContext(WalletContext)
