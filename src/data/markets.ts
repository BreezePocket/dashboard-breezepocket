export type ChainId = 101
export type OptionType = 'call' | 'put'

/** PAYtience runs on Solana mainnet only. */
export const SOLANA: ChainId = 101
export const CHAINS: Record<ChainId, { name: string; icon: string }> = {
  101: { name: 'Solana', icon: '/icons/solana.svg' },
}

/** Tokenized pre-IPO companies issued by PreStocks (prestocks.com); the desk quotes them from a synthetic chain. */
const PRESTOCKS = new Set(['ANTHROPIC', 'OPENAI', 'SPACEX', 'ANDURIL', 'NEURALINK', 'FIGUREAI', 'KALSHI', 'POLYMARKET'])
export const isPreStocks = (asset: string) => PRESTOCKS.has(asset)

export const iconFor = (symbol: string) =>
  symbol === 'PAXG'
    ? '/icons/paxg.png'
    : PRESTOCKS.has(symbol)
      ? `https://prestocks.com/logos/${symbol.toLowerCase()}.png`
      : `/icons/${symbol.toLowerCase()}.svg`

/** Tokenized real-world assets, as opposed to native crypto. PreStocks count: they track private company shares. */
const RWA = new Set([...PRESTOCKS, 'PAXG', 'XAGon', 'TSLAon', 'NVDAon', 'HYNIXon', 'SPYon', 'QQQon', 'AAPLon', 'MSFTon', 'AMZNon', 'GOOGLon', 'METAon', 'NFLXon', 'COINon', 'MSTRon'])
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
  AAPLon: 'Apple',
  MSFTon: 'Microsoft',
  AMZNon: 'Amazon',
  GOOGLon: 'Alphabet',
  METAon: 'Meta Platforms',
  NFLXon: 'Netflix',
  COINon: 'Coinbase',
  MSTRon: 'Strategy',
  ANTHROPIC: 'Anthropic',
  OPENAI: 'OpenAI',
  SPACEX: 'SpaceX',
  ANDURIL: 'Anduril',
  NEURALINK: 'Neuralink',
  FIGUREAI: 'Figure AI',
  KALSHI: 'Kalshi',
  POLYMARKET: 'Polymarket',
}
export const assetName = (asset: string) => ASSET_NAMES[asset] ?? asset

export type Market = {
  asset: string
  chainId: ChainId
  collateral: string
  strike: string
  type: OptionType
}

// No APRs here: the Earn table shows only what the market-maker desk is quoting.
const call = (asset: string, strike: string): Market => ({
  asset, chainId: SOLANA, collateral: asset, strike, type: 'call',
})
const put = (asset: string, stable: string): Market => ({
  asset, chainId: SOLANA, collateral: stable, strike: stable, type: 'put',
})

export const CALLS: Market[] = [
  call('SOL', 'USDC'),
  call('WBTC', 'USDC'),
  call('WETH', 'USDC'),
  call('TSLAon', 'USDC'),
  call('NVDAon', 'USDC'),
  call('HYNIXon', 'USDC'),
  call('XAGon', 'USDC'),
  call('QQQon', 'USDC'),
  call('SPYon', 'USDC'),
  call('PAXG', 'USDC'),
  call('AAPLon', 'USDC'),
  call('MSFTon', 'USDC'),
  call('AMZNon', 'USDC'),
  call('GOOGLon', 'USDC'),
  call('METAon', 'USDC'),
  call('NFLXon', 'USDC'),
  call('COINon', 'USDC'),
  call('MSTRon', 'USDC'),
  call('ANTHROPIC', 'USDC'),
  call('OPENAI', 'USDC'),
  call('SPACEX', 'USDC'),
  call('ANDURIL', 'USDC'),
  call('NEURALINK', 'USDC'),
  call('FIGUREAI', 'USDC'),
  call('KALSHI', 'USDC'),
  call('POLYMARKET', 'USDC'),
  call('JUP', 'USDC'),
  call('PYTH', 'USDC'),
  call('RAY', 'USDC'),
]

export const PUTS: Market[] = [
  put('SOL', 'USDC'),
  put('WBTC', 'USDC'),
  put('WETH', 'USDC'),
  put('TSLAon', 'USDC'),
  put('NVDAon', 'USDC'),
  put('HYNIXon', 'USDC'),
  put('XAGon', 'USDC'),
  put('QQQon', 'USDC'),
  put('SPYon', 'USDC'),
  put('PAXG', 'USDC'),
  put('AAPLon', 'USDC'),
  put('MSFTon', 'USDC'),
  put('AMZNon', 'USDC'),
  put('GOOGLon', 'USDC'),
  put('METAon', 'USDC'),
  put('NFLXon', 'USDC'),
  put('COINon', 'USDC'),
  put('MSTRon', 'USDC'),
  put('ANTHROPIC', 'USDC'),
  put('OPENAI', 'USDC'),
  put('SPACEX', 'USDC'),
  put('ANDURIL', 'USDC'),
  put('NEURALINK', 'USDC'),
  put('FIGUREAI', 'USDC'),
  put('KALSHI', 'USDC'),
  put('POLYMARKET', 'USDC'),
  put('JUP', 'USDC'),
  put('RAY', 'USDC'),
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
