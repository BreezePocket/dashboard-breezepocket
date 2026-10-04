/**
 * Login and the wallet for the whole app, through Privy.
 *
 * A visitor logs in with Google, a phone number or their own Solana wallet. Google and
 * phone users get a wallet Privy makes for their account, the same one they have in the
 * mobile app; wallet users keep using their own. Either way the rest of the app sees one
 * `publicKey` and one `signTransaction`.
 */
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { PrivyProvider, usePrivy, type PrivyClientConfig, type User, type WalletWithMetadata } from '@privy-io/react-auth'
import { toSolanaWalletConnectors, useCreateWallet, useExportWallet, useSignTransaction, useWallets } from '@privy-io/react-auth/solana'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'
import { PublicKey, Transaction, type Connection } from '@solana/web3.js'
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, RPC_URL, SOLANA_CHAIN, WS_URL } from '../lib/config'
import { WalletContext, type WalletInfo, type WalletState } from '../lib/wallet'

const isEmbedded = (a: WalletWithMetadata) => a.walletClientType === 'privy' || a.walletClientType === 'privy-v2' || a.connectorType === 'embedded'

/** An email, else a phone number, else the name of the wallet they came in with. */
const identityOf = (user: User | null, wallet: WalletInfo | null) => user?.google?.email ?? user?.phone?.number ?? (wallet && !wallet.embedded ? wallet.name : null)

function Account({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, login: openLogin, logout, connectWallet } = usePrivy()
  const { wallets, ready: walletsReady } = useWallets()
  const { signTransaction: signWith } = useSignTransaction()
  const { createWallet } = useCreateWallet()
  const { exportWallet } = useExportWallet()

  const linked = useMemo(
    () => (user?.linkedAccounts ?? []).filter((a): a is WalletWithMetadata => a.type === 'wallet' && a.chainType === 'solana'),
    [user],
  )

  // Only a wallet linked to this account counts: a wallet extension that happens to be
  // connected in the browser, but was never used to log in, is not the visitor's wallet here.
  const active = useMemo(() => {
    if (!ready || !authenticated) return null
    const connected = new Map(wallets.map((w) => [w.address, w]))
    // Someone who logged in with their own wallet keeps using it; everyone else has the one Privy made.
    const account = linked.find((a) => !isEmbedded(a) && connected.has(a.address)) ?? linked.find((a) => isEmbedded(a) && connected.has(a.address))
    const wallet = account && connected.get(account.address)
    return account && wallet ? { account, wallet } : null
  }, [ready, authenticated, linked, wallets])

  const address = active?.account.address ?? null
  // Keyed on the address text, so the object stays the same across renders and the hooks
  // that depend on it (balances, positions) do not refetch for nothing.
  const publicKey = useMemo(() => (address ? new PublicKey(address) : null), [address])

  const ownWalletMissing = authenticated && walletsReady && !active && linked.some((a) => !isEmbedded(a))
  const connecting = ready && authenticated && !active && !ownWalletMissing

  // Privy makes the wallet as part of logging in. If that did not happen (a closed tab, a
  // network blip), make it now instead of leaving the visitor logged in without one.
  const create = useRef(createWallet)
  useEffect(() => { create.current = createWallet }, [createWallet])
  const noWallet = ready && authenticated && walletsReady && linked.length === 0
  useEffect(() => {
    if (!noWallet) return
    const id = setTimeout(() => { create.current().catch(() => { /* Privy made it in the meantime, or the visitor will retry by logging in again */ }) }, 4000)
    return () => clearTimeout(id)
  }, [noWallet])

  const login = useCallback(() => {
    if (!ready) return
    if (!authenticated) openLogin()
    else if (ownWalletMissing) connectWallet({ walletChainType: 'solana-only' })
  }, [ready, authenticated, ownWalletMissing, openLogin, connectWallet])

  const signer = active?.wallet ?? null
  const signTransaction = useCallback(
    async (tx: Transaction) => {
      if (!signer) throw new Error('Log in first.')
      // The market maker is the fee payer and signs after us, so its slot is still empty here.
      const unsigned = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
      const { signedTransaction } = await signWith({ transaction: new Uint8Array(unsigned), wallet: signer, chain: SOLANA_CHAIN })
      return Transaction.from(signedTransaction)
    },
    [signer, signWith],
  )

  const sendTransaction = useCallback(
    async (tx: Transaction, connection: Connection) => {
      const signed = await signTransaction(tx)
      return connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' })
    },
    [signTransaction],
  )

  const embedded = active ? isEmbedded(active.account) : false
  const walletName = active?.wallet.standardWallet.name ?? null
  const walletIcon = active?.wallet.standardWallet.icon ?? null
  const wallet = useMemo<WalletInfo | null>(
    () => (walletName === null ? null : { name: walletName, icon: embedded ? null : walletIcon, embedded }),
    [walletName, walletIcon, embedded],
  )

  const exportKey = useMemo(() => (embedded && address ? () => exportWallet({ address }) : null), [embedded, address, exportWallet])

  const value = useMemo<WalletState>(
    () => ({
      ready,
      connected: !!publicKey,
      connecting,
      publicKey,
      wallet,
      identity: identityOf(user, wallet),
      needsWallet: ownWalletMissing,
      login,
      logout,
      exportKey,
      signTransaction,
      sendTransaction,
    }),
    [ready, publicKey, connecting, wallet, user, ownWalletMissing, login, logout, exportKey, signTransaction, sendTransaction],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

/* ---------- Privy setup ---------- */

// Made once: Privy keeps these across renders.
const solanaConnectors = toSolanaWalletConnectors()
const solanaRpcs = { [SOLANA_CHAIN]: { rpc: createSolanaRpc(RPC_URL), rpcSubscriptions: createSolanaRpcSubscriptions(WS_URL) } }

/** Privy's window takes the app's panel colour, so it reads as part of the page in every theme. */
const WINDOW_COLOUR: Record<string, 'light' | `#${string}`> = { light: 'light', dark: '#06173f', vault: '#161616' }

const watchTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
const readTheme = () => document.documentElement.dataset.theme ?? 'light'

type CountryCode = NonNullable<PrivyClientConfig['intl']>['defaultCountry']
/** The phone-number field starts on the visitor's own country when the browser says which it is. */
function browserCountry(): CountryCode {
  try {
    const region = new Intl.Locale(navigator.language).region
    if (region && /^[A-Z]{2}$/.test(region)) return region as CountryCode
  } catch {
    /* an odd language tag: fall through */
  }
  return 'US'
}

export function WalletProvider({ children }: { children: ReactNode }) {
  // App.tsx puts the theme on <html>; follow it from there.
  const theme = useSyncExternalStore(watchTheme, readTheme)
  const config = useMemo<PrivyClientConfig>(
    () => ({
      loginMethods: ['google', 'sms', 'wallet'],
      appearance: {
        theme: WINDOW_COLOUR[theme] ?? 'light',
        accentColor: '#0b5cff',
        // The mark from components/Logo as a file. It carries its own width and height: an
        // SVG with only a viewBox collapses to nothing in Privy's window.
        logo: '/icons/logo-mark.svg',
        landingHeader: 'Log in to PAYtience',
        showWalletLoginFirst: false,
        walletChainType: 'solana-only',
        walletList: ['phantom', 'solflare', 'backpack', 'detected_solana_wallets'],
      },
      intl: { defaultCountry: browserCountry() },
      embeddedWallets: {
        ethereum: { createOnLogin: 'off' },
        solana: { createOnLogin: 'users-without-wallets' },
        // The app's own confirm step shows the whole deal; a second, generic prompt would add nothing.
        showWalletUIs: false,
      },
      externalWallets: { solana: { connectors: solanaConnectors } },
      solana: { rpcs: solanaRpcs },
    }),
    [theme],
  )

  return (
    <PrivyProvider appId={PRIVY_APP_ID} {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})} config={config}>
      <Account>{children}</Account>
    </PrivyProvider>
  )
}
