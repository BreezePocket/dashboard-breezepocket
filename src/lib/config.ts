/** Chain and service endpoints. Everything points at Solana devnet, where the program is deployed. */
export const CLUSTER = 'devnet' as const
export const RPC_URL: string = import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com'
export const WS_URL: string = import.meta.env.VITE_SOLANA_WS || 'wss://api.devnet.solana.com/'
/**
 * Build-time default for the PAYtience backend, which aggregates every connected market
 * maker. VITE_MM_URL is the legacy name (it may also point at a single desk). Runtime
 * overrides live in lib/mm.ts.
 */
export const API_URL_DEFAULT: string = import.meta.env.VITE_API_URL || import.meta.env.VITE_MM_URL || ''

/**
 * The Privy app that handles login and wallets. An App ID is public, so it ships with the
 * site; the app secret is for servers only and never belongs here.
 */
export const PRIVY_APP_ID: string = import.meta.env.VITE_PRIVY_APP_ID || 'cmutu8fsl00d20cl72pux036f'
/** Optional: a Privy app client for this site, when its settings differ from the app's defaults. */
export const PRIVY_CLIENT_ID: string = import.meta.env.VITE_PRIVY_CLIENT_ID || ''
/** The cluster in the form wallets expect. */
export const SOLANA_CHAIN = `solana:${CLUSTER}` as const

export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=${CLUSTER}`
export const explorerAddr = (addr: string) => `https://explorer.solana.com/address/${addr}?cluster=${CLUSTER}`
