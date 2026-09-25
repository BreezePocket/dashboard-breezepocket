export type ChainId = 101
export type OptionType = 'call' | 'put'

/** BreezePocket runs on Solana mainnet only. */
export const SOLANA: ChainId = 101
export const CHAINS: Record<ChainId, { name: string; icon: string }> = {
  101: { name: 'Solana', icon: '/icons/solana.svg' },
}

export const iconFor = (symbol: string) => (symbol === 'PAXG' ? '/icons/paxg.png' : `/icons/${symbol.toLowerCase()}.svg`)

/** Tokenized real-world assets, as opposed to native crypto. */
const RWA = new Set(['PAXG', 'XAGon', 'TSLAon', 'NVDAon', 'HYNIXon', 'SPYon', 'QQQon'])
export const isRwa = (asset: string) => RWA.has(asset)

/** Long-form label for an asset, shown under the ticker on the Earn table. */
const ASSET_NAMES: Record<string, string> = {
  SOL: 'Solana',
  WBTC: 'Wrapped Bitcoin',
  WETH: 'Wrapped Ether',
  JUP: 'Jupiter',
  PYTH: 'Pyth Network',
  RAY: 'Raydium',
  PAXG: 'Tokenized Gold',
  XAGon: 'Tokenized Silver',
  TSLAon: 'Tesla',
  NVDAon: 'NVIDIA',
  HYNIXon: 'SK Hynix',
  SPYon: 'S&P 500 ETF',
  QQQon: 'Nasdaq-100 ETF',
}
export const assetName = (asset: string) => ASSET_NAMES[asset] ?? asset

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
  call('WBTC', 'USDC', 91.56, 2.47),
  call('WETH', 'USDC', 104.22, 4.11),
  call('TSLAon', 'USDC', 86.24, 5.2),
  call('NVDAon', 'USDC', 74.18, 4.86),
  call('HYNIXon', 'USDC', 68.55, 4.62),
  call('XAGon', 'USDC', 34.86, 3.55),
  call('QQQon', 'USDC', 28.9, 3.12),
  call('SPYon', 'USDC', 22.4, 2.85),
  call('PAXG', 'USDC', 18.42, 3.1),
  call('JUP', 'USDC', 118.4, 4.62),
  call('PYTH', 'USDC', 112.7, 3.88),
  call('RAY', 'USDC', 123.39, 4.44),
]

export const PUTS: Market[] = [
  put('SOL', 'USDC', 99.55, 4.03),
  put('WBTC', 'USDC', 95.41, 4.07),
  put('WETH', 'USDC', 114.96, 5.16),
  put('TSLAon', 'USDC', 79.6, 5.05),
  put('NVDAon', 'USDC', 70.3, 4.7),
  put('HYNIXon', 'USDC', 64.1, 4.45),
  put('XAGon', 'USDC', 31.2, 3.4),
  put('QQQon', 'USDC', 26.4, 3.05),
  put('SPYon', 'USDC', 20.15, 2.7),
  put('PAXG', 'USDC', 16.85, 2.98),
  put('JUP', 'USDC', 108.2, 4.9),
  put('RAY', 'USDC', 101.3, 4.35),
]

export const marketHref = (m: Market, expiryId?: string) =>
  `/earn?asset=${m.asset}&collateral=${m.collateral}&strike=${m.strike}&type=${m.type}` +
  (expiryId ? `&expiry=${expiryId}` : '')

/** Distinct assets that have a market of this type. */
export const assetsFor = (type: OptionType) =>
  [...new Set((type === 'call' ? CALLS : PUTS).filter((m) => m.type === type).map((m) => m.asset))]

/** Every market for one asset and type, one per collateral token. */
export const marketsFor = (asset: string, type: OptionType) =>
  (type === 'call' ? CALLS : PUTS).filter((m) => m.asset === asset)

/**
 * Best market for the requested asset and type, preferring the given collateral.
 * Falls back to the first market of that type when the asset has none.
 */
export const findMarket = (asset: string, type: OptionType, collateral?: string): Market => {
  const list = marketsFor(asset, type)
  return list.find((m) => m.collateral === collateral) ?? list[0] ?? (type === 'call' ? CALLS : PUTS)[0]
}

export const CAP_SOLD = { call: 44.39, put: 52.42 }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type Expiry = { id: string; date: Date }

/** Last Friday of the given month, at 08:00 UTC. */
const lastFridayUTC = (year: number, month: number) => {
  const d = new Date(Date.UTC(year, month + 1, 0, 8, 0, 0))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 2) % 7))
  return d
}

/** The next few monthly expiries, at least a week out. */
const buildExpiries = (count: number): Expiry[] => {
  const now = Date.now()
  const start = new Date()
  const out: Expiry[] = []
  for (let i = 0; out.length < count && i < 24; i++) {
    const d = lastFridayUTC(start.getUTCFullYear(), start.getUTCMonth() + i)
    if (d.getTime() - now > 7 * 86_400_000) out.push({ id: `${MONTHS[d.getUTCMonth()]}_${d.getUTCDate()}`, date: d })
  }
  return out
}

export const EXPIRIES = buildExpiries(4)

export const findExpiry = (id: string | null): Expiry => EXPIRIES.find((e) => e.id === id) ?? EXPIRIES[0]
export const expiryLabel = (e: Expiry) => e.id
export const daysToExpiry = (e: Expiry) => Math.max(1, Math.ceil((e.date.getTime() - Date.now()) / 86_400_000))

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
export const expiryLong = (e: Expiry) =>
  `${MONTHS[e.date.getUTCMonth()]} ${ordinal(e.date.getUTCDate())}, ${e.date.getUTCFullYear()}`

export const fmtPrice = (n: number) => {
  const opts = n >= 1000 ? { maximumFractionDigits: 0 } : n >= 1 ? { maximumFractionDigits: 2 } : { maximumFractionDigits: 4 }
  return '$' + n.toLocaleString('en-US', opts)
}
export const fmtNum = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
