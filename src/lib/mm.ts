/**
 * Client for the PAYtience market-maker desk (REST API from the MM-system-breezepocket repo).
 *
 * The desk URL is resolved at runtime, in order: a `?mm=` query override (persisted),
 * the build-time VITE_MM_URL, then http://localhost:8787 for a desk running next to
 * the browser. The first candidate whose /health answers wins.
 */
import { MM_URL_DEFAULT } from './config'

export type Product = 'sell_sol' | 'buy_sol'

export type DeskHealth = {
  ok: boolean
  mm_pubkey: string
  program_id: string
  usdc_mint: string
  dry_run: boolean
  price: { source?: string; spot: number; spotAgeMs: number; vol: number; expiries?: number }
  /** Every asset the desk prices. Only `tradable` ones (SOL and assets listed on chain) can be opened; the rest are quote-only. */
  assets?: DeskAsset[]
  exposure: {
    totalUsd: number
    capTotalUsd: number
    capPerExpiryUsd: number
    perExpiry: Record<string, { onChainUsd: number; reservedUsd: number }>
  }
}
export type DeskAsset = {
  asset: string
  underlying: string
  venue: string
  tradable: boolean
  fresh: boolean
  spot: number | null
  atm_vol: number | null
  expiries: number | null
  /** Listed assets only: the SPL mint to trade, its decimals, and the UTC second of day expiries land on. */
  mint?: string | null
  decimals?: number | null
  expiry_time_of_day?: number | null
}
export type DeskExpiry = { expiry_ts: number; days: number; forward_price: number; atm_vol: number | null; strikes: number[] }
export type BoardCell = {
  moneyness: number
  fixed_price: number
  yield_amount: string
  yield_pct: number
  apr_pct: number
  option_mark_usdc: number
  implied_vol: number
  price_source: string
  instrument: string | null
}
export type BoardRow = { expiry_ts: number; days: number; forward_price: number; atm_vol: number | null; quotes: BoardCell[] }
export type Board = {
  asset: string
  underlying: string
  venue: string
  tradable: boolean
  /** The listed SPL mint; null for SOL and quote-only assets. */
  mint?: string | null
  decimals?: number
  product: Product
  /** Collateral: 'sol' for SOL calls, the asset symbol for other calls, 'usdc' for puts. */
  token: string
  amount: string
  index_price: number
  fee_pct: number
  mm_pubkey: string
  generated_at: number
  expiries: BoardRow[]
}
export type Quote = {
  type: 'rfq_response'
  rfq_id: string
  quote_id: string
  yield_amount: string
  yield_pct: number
  apr_pct: number
  mm_pubkey: string
  valid_until: number
  price_source: string
  instrument: string | null
  index_price: number
  forward_price: number
  implied_vol: number
  fee_pct: number | null
}
export type Decline = { type: 'rfq_decline'; rfq_id: string; reason: string }
export type SignResponse = { type: 'sign_response'; request_id: string; tx_base64: string; signature?: string }
export type SignRejection = { type: 'sign_rejection'; request_id: string; reason: string }
export type FaucetInfo = { enabled: boolean; amount_usdc: number; asset_usd?: number; cooldown_ms: number; usdc_mint: string }
export type FaucetResult = { pubkey: string; asset?: string; amount?: number; usdc_amount: number; usdc_signature: string; sol_airdrop_signature: string | null }

export type RfqRequest = {
  /** Omitted or 'SOL' for SOL; otherwise a listed asset's symbol. */
  asset?: string
  product: Product
  fixedPrice: bigint
  expiryTs: number
  amount: bigint
  userPubkey: string
  nonce: bigint
}

const LS_KEY = 'paytience.mmUrl'
const LOCAL = 'http://localhost:8787'

export function mmUrlCandidates(): string[] {
  const out: string[] = []
  try {
    const q = new URLSearchParams(window.location.search).get('mm')
    if (q) localStorage.setItem(LS_KEY, q.replace(/\/+$/, ''))
    const saved = localStorage.getItem(LS_KEY)
    if (saved) out.push(saved)
  } catch {
    /* storage unavailable */
  }
  if (MM_URL_DEFAULT) out.push(MM_URL_DEFAULT.replace(/\/+$/, ''))
  out.push(LOCAL)
  return [...new Set(out)]
}

export class DeskClient {
  readonly baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async get<T>(path: string, timeoutMs = 8000): Promise<T> {
    const r = await fetch(this.baseUrl + path, { signal: AbortSignal.timeout(timeoutMs) })
    const j = await r.json()
    if (!r.ok) throw new Error(j?.error ?? r.statusText)
    return j as T
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
    const j = await r.json()
    // Declines and rejections come back as typed messages; anything else non-2xx is an error.
    if (!r.ok && !(j && typeof j === 'object' && 'type' in j)) throw new Error(j?.error ?? r.statusText)
    return j as T
  }

  health(timeoutMs?: number) { return this.get<DeskHealth>('/health', timeoutMs) }
  /** Omitting `asset` means SOL. */
  expiries(asset?: string) {
    const q = asset ? `?asset=${encodeURIComponent(asset)}` : ''
    return this.get<{ expiries: DeskExpiry[] }>(`/expiries${q}`).then((r) => r.expiries)
  }
  board(opts: { asset?: string; product: Product; amount?: number; maxDays?: number; moneyness?: number[] }) {
    const p = new URLSearchParams({ product: opts.product })
    if (opts.asset) p.set('asset', opts.asset)
    if (opts.amount !== undefined) p.set('amount', String(opts.amount))
    if (opts.maxDays !== undefined) p.set('max_days', String(opts.maxDays))
    if (opts.moneyness?.length) p.set('moneyness', opts.moneyness.join(','))
    return this.get<Board>(`/board?${p}`)
  }
  rfq(req: RfqRequest) {
    return this.post<Quote | Decline>('/rfq', {
      type: 'rfq_request',
      rfq_id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...(req.asset && req.asset !== 'SOL' ? { asset: req.asset } : {}),
      product: req.product,
      fixed_price: req.fixedPrice.toString(),
      expiry_ts: req.expiryTs,
      amount: req.amount.toString(),
      user_pubkey: req.userPubkey,
      nonce: req.nonce.toString(),
    })
  }
  sign(txBase64: string) {
    return this.post<SignResponse | SignRejection>('/sign', {
      type: 'sign_request',
      request_id: `web-sign-${Date.now()}`,
      tx_base64: txBase64,
    })
  }
  async faucetInfo(): Promise<FaucetInfo | null> {
    try {
      return await this.get<FaucetInfo>('/faucet', 4000)
    } catch {
      return null
    }
  }
  /** Test USDC, or the listed `asset`'s test token. */
  faucet(pubkey: string, asset?: string) { return this.post<FaucetResult>('/faucet', asset ? { pubkey, asset } : { pubkey }) }
}

/** Try each candidate URL until one answers /health. */
export async function resolveDesk(): Promise<{ client: DeskClient; health: DeskHealth } | null> {
  for (const url of mmUrlCandidates()) {
    const client = new DeskClient(url)
    try {
      const health = await client.health(3500)
      if (health && typeof health.mm_pubkey === 'string') return { client, health }
    } catch {
      /* try the next one */
    }
  }
  return null
}

/** Random u64 nonce, part of the position PDA seed so a quote can only be used once. */
export function randomNonce(): bigint {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  return new DataView(b.buffer).getBigUint64(0, true)
}

/** Where a quote-only asset's price comes from, for tooltips and notices. */
export const priceSource = (venue: string, underlying: string) =>
  venue === 'deribit'
    ? `the Deribit ${underlying} option chain`
    : venue === 'alpaca'
      ? `${underlying} listed options via Alpaca (indicative feed)`
      : venue === 'prestocks'
        ? `a synthetic chain on the ${underlying} PreStocks token price`
        : `${underlying} (${venue})`

export const productLabel = (p: Product) => (p === 'sell_sol' ? 'Sell high' : 'Buy low')
export const productForType = (t: 'call' | 'put'): Product => (t === 'call' ? 'sell_sol' : 'buy_sol')
export const collateralOf = (p: Product) => (p === 'sell_sol' ? 'SOL' : 'USDC')
