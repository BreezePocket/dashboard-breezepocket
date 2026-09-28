/** Chain and service endpoints. Everything points at Solana devnet, where the program is deployed. */
export const CLUSTER = 'devnet'
export const RPC_URL: string = import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com'
export const WS_URL: string = import.meta.env.VITE_SOLANA_WS || 'wss://api.devnet.solana.com/'
/**
 * Build-time default for the PAYtience backend, which aggregates every connected market
 * maker. VITE_MM_URL is the legacy name (it may also point at a single desk). Runtime
 * overrides live in lib/mm.ts.
 */
export const API_URL_DEFAULT: string = import.meta.env.VITE_API_URL || import.meta.env.VITE_MM_URL || ''

export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=${CLUSTER}`
export const explorerAddr = (addr: string) => `https://explorer.solana.com/address/${addr}?cluster=${CLUSTER}`
