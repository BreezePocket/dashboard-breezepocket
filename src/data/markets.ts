export type ChainId = 101
export type OptionType = 'call' | 'put'

/** BreezePocket runs on Solana mainnet only. */
export const SOLANA: ChainId = 101
export const CHAINS: Record<ChainId, { name: string; icon: string }> = {
  101: { name: 'Solana', icon: '/icons/solana.svg' },
}

export const iconFor = (symbol: string) => `/icons/${symbol.toLowerCase()}.svg`

/** Reference asset + placeholder spot price for each collateral token. */
const UNDERLYING: Record<string, { name: string; spot: number }> = {
  SOL: { name: 'SOL', spot: 208.4 },
  JitoSOL: { name: 'JitoSOL', spot: 254.1 },
  mSOL: { name: 'mSOL', spot: 262.7 },
  WBTC: { name: 'BTC', spot: 111_850 },
  WETH: { name: 'ETH', spot: 4_312 },
  JUP: { name: 'JUP', spot: 0.92 },
  PYTH: { name: 'PYTH', spot: 0.31 },
  RAY: { name: 'RAY', spot: 3.24 },
}
export const underlyingOf = (asset: string) => UNDERLYING[asset] ?? { name: asset, spot: 100 }

export type Market = {
  asset: string
  chainId: ChainId
  collateral: string
  strike: string
  type: OptionType
  maxApr: number
  minApr: number
}

const call = (asset: string, strike: string, maxApr: number, minApr: number): Market => ({
  asset, chainId: SOLANA, collateral: asset, strike, type: 'call', maxApr, minApr,
})
const put = (asset: string, stable: string, maxApr: number, minApr: number): Market => ({
  asset, chainId: SOLANA, collateral: stable, strike: stable, type: 'put', maxApr, minApr,
})

export const CALLS: Market[] = [
  call('SOL', 'USDC', 140.29, 4.15),
  call('JitoSOL', 'USDC', 140.29, 4.15),
  call('mSOL', 'USDC', 140.29, 4.15),
  call('WBTC', 'USDC', 91.56, 2.47),
  call('WETH', 'USDC', 104.22, 4.11),
  call('JUP', 'USDC', 118.4, 4.62),
  call('PYTH', 'USDC', 112.7, 3.88),
  call('RAY', 'USDC', 123.39, 4.44),
]

export const PUTS: Market[] = [
  put('SOL', 'USDC', 99.55, 4.03),
  put('SOL', 'USDT', 99.55, 4.03),
  put('JitoSOL', 'USDC', 99.55, 4.03),
  put('WBTC', 'USDC', 95.41, 4.07),
  put('WBTC', 'USDT', 95.41, 4.07),
  put('WETH', 'USDC', 114.96, 5.16),
  put('WETH', 'USDT', 114.96, 5.16),
  put('JUP', 'USDC', 108.2, 4.9),
  put('RAY', 'USDC', 101.3, 4.35),
]

export const marketHref = (m: Market) =>
  `/earn?asset=${m.asset}&collateral=${m.collateral}&strike=${m.strike}&type=${m.type}`

export const CAP_SOLD = { call: 44.39, put: 52.42 }

/** Fixed expiry used across the app. */
export const EXPIRY = new Date(Date.UTC(2026, 9, 30, 8, 0, 0))
export const expiryLabel = () =>
  `${EXPIRY.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}_${EXPIRY.getUTCDate()}`
export const daysToExpiry = () => Math.max(1, Math.ceil((EXPIRY.getTime() - Date.now()) / 86_400_000))

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
export const expiryLong = () =>
  `${EXPIRY.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${ordinal(EXPIRY.getUTCDate())}, ${EXPIRY.getUTCFullYear()}`

/** Round a strike to a sensible tick for its magnitude. */
export const roundStrike = (x: number) => {
  if (x >= 10_000) return Math.round(x / 500) * 500
  if (x >= 1_000) return Math.round(x / 50) * 50
  if (x >= 10) return Math.round(x * 2) / 2
  if (x >= 1) return Math.round(x * 20) / 20
  return Math.round(x * 1000) / 1000
}

export type Strike = { price: number; apr: number; tone: 'red' | 'amber' | 'green' }

const CALL_MULT = [1.08, 1.11, 1.146, 1.216, 1.4, 1.487]
const PUT_MULT = [0.925, 0.9, 0.87, 0.82, 0.7, 0.62]
const APRS = [36.41, 30.82, 25.29, 17.19, 7.06, 4.83]

export const strikesFor = (asset: string, type: OptionType): Strike[] => {
  const { spot } = underlyingOf(asset)
  const mults = type === 'call' ? CALL_MULT : PUT_MULT
  return mults.map((m, i) => {
    const apr = APRS[i]
    return { price: roundStrike(spot * m), apr, tone: apr > 33 ? 'red' : apr > 20 ? 'amber' : 'green' }
  })
}

export const fmtPrice = (n: number) => {
  const opts = n >= 1000 ? { maximumFractionDigits: 0 } : n >= 1 ? { maximumFractionDigits: 2 } : { maximumFractionDigits: 4 }
  return '$' + n.toLocaleString('en-US', opts)
}
export const fmtNum = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
