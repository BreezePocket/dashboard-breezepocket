import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Buffer } from 'buffer'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import Dropdown from '../components/Dropdown'
import { useDesk } from '../components/DeskProvider'
import { useBalances } from '../hooks/useBalances'
import { CHAINS, SOLANA, iconFor, assetName, assetsFor, findMarket, marketHref, fmtPrice, fmtNum, type OptionType } from '../data/markets'
import {
  collateralOf, productForType, productLabel, randomNonce,
  type Board, type BoardCell, type DeskExpiry, type FaucetInfo, type Product, type Quote,
} from '../lib/mm'
import { buildOpenPositionTx, positionPda, solToLamports, usdcToBase, priceToBase, lamportsToSol, baseToUsdc } from '../lib/program'
import { explorerAddr, explorerTx } from '../lib/config'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ordinal = (n: number) => n + (['th', 'st', 'nd', 'rd'][((n % 100) - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th')
const expiryShort = (ts: number) => { const d = new Date(ts * 1000); return `${MONTHS[d.getUTCMonth()]}_${d.getUTCDate()}` }
const pad2 = (n: number) => String(n).padStart(2, '0')
// The hour comes from the expiry itself: Deribit (SOL) settles at 08:00 UTC, US listed options at the 20:00 UTC close.
const expiryLong = (ts: number) => { const d = new Date(ts * 1000); return `${MONTHS[d.getUTCMonth()]} ${ordinal(d.getUTCDate())}, ${d.getUTCFullYear()} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC` }
const tone = (apr: number) => (apr > 33 ? 'red' : apr > 20 ? 'amber' : 'green')
const TYPES: { id: OptionType; label: string }[] = [
  { id: 'call', label: 'Covered call' },
  { id: 'put', label: 'Cash secured put' },
]

type Flow =
  | { step: 'idle' }
  | { step: 'quoting' }
  | { step: 'quoted'; quote: Quote; nonce: bigint; fixedPrice: bigint; amount: bigint; expiryTs: number; product: Product }
  | { step: 'declined'; reason: string }
  | { step: 'signing' }
  | { step: 'cosigning' }
  | { step: 'broadcasting' }
  | { step: 'confirming'; signature: string }
  | { step: 'done'; signature: string; position: string }
  | { step: 'error'; message: string }

const friendly = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e)
  if (/User rejected|rejected the request/i.test(m)) return 'Signature request was rejected in the wallet.'
  if (/insufficient/i.test(m)) return `Insufficient balance: ${m}`
  return m
}

export default function EarnDetail() {
  const [params] = useSearchParams()
  const asset = params.get('asset') || 'SOL'
  const type = (params.get('type') === 'put' ? 'put' : 'call') as OptionType
  const expiryParam = Number(params.get('expiry')) || null
  if (asset === 'SOL') return <LiveSolMarket type={type} expiryParam={expiryParam} />
  // Anything else is live only if the desk prices it; QuoteOnlyMarket falls back to ComingSoon when it does not.
  return <QuoteOnlyMarket asset={asset} type={type} expiryParam={expiryParam} />
}

/* ---------------------------------------------------------------------------------------- */

function HeaderChips({ asset, type, extra }: { asset: string; type: OptionType; extra?: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="ed-head-group">
      <Dropdown
        label="Asset"
        value={asset}
        options={assetsFor(type).map((a) => ({ id: a, label: a, icon: iconFor(a) }))}
        onChange={(a) => navigate(marketHref(findMarket(a, type)))}
      />
      <Dropdown label="Strategy" value={type} options={TYPES} onChange={(t) => navigate(marketHref(findMarket(asset, t as OptionType)))} />
      {extra}
    </div>
  )
}

function ComingSoon({ asset, type }: { asset: string; type: OptionType }) {
  return (
    <section className="page">
      <PageTitle>Earn yield upfront</PageTitle>
      <Terminal title={`~/earn/${asset}`}>
        <div className="ed-head">
          <HeaderChips asset={asset} type={type} />
        </div>
        <div className="ed-body">
          <div className="soon-panel">
            <img src={iconFor(asset)} alt="" />
            <h2>{assetName(asset)} is not live on devnet yet</h2>
            <p>
              The breezepocket program currently settles SOL commitments only. {asset} {type === 'call' ? 'covered calls' : 'cash-secured puts'} are
              on the roadmap and will use the same market maker, expiries and settlement flow once the asset is listed.
            </p>
            <div className="soon-links">
              <Link className="btn-earn" to={marketHref(findMarket('SOL', 'call'))}><span className="ic"><img src={iconFor('SOL')} alt="" /></span>SOL covered call</Link>
              <Link className="btn-earn" to={marketHref(findMarket('SOL', 'put'))}><span className="ic"><img src={iconFor('USDC')} alt="" /></span>SOL cash-secured put</Link>
            </div>
          </div>
        </div>
      </Terminal>
    </section>
  )
}

/* ---------------------------------------------------------------------------------------- */

function LiveSolMarket({ type, expiryParam }: { type: OptionType; expiryParam: number | null }) {
  const navigate = useNavigate()
  const product = productForType(type)
  const collateral = collateralOf(product)
  const { client, health, status } = useDesk()
  const { connection } = useConnection()
  const { publicKey, connected, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()
  const balances = useBalances()

  const [expiries, setExpiries] = useState<DeskExpiry[]>([])
  const [board, setBoard] = useState<Board | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [amount, setAmount] = useState(product === 'sell_sol' ? '1' : '100')
  const [strike, setStrike] = useState<number | null>(null)
  const [flow, setFlow] = useState<Flow>({ step: 'idle' })
  const [now, setNow] = useState(Date.now())
  const [faucet, setFaucet] = useState<FaucetInfo | null>(null)
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null)
  const lastQuote = useRef<Extract<Flow, { step: 'quoted' }> | null>(null)

  const expiryTs = expiryParam && expiries.some((e) => e.expiry_ts === expiryParam) ? expiryParam : expiries[0]?.expiry_ts ?? null
  const spot = health?.price.spot ?? board?.index_price ?? null
  const qty = Math.max(0, parseFloat(amount) || 0)
  const amountBase = product === 'sell_sol' ? solToLamports(qty) : usdcToBase(qty)

  // Live expiries and yield board from the desk, refreshed every 30s.
  useEffect(() => {
    if (!client) return
    let cancelled = false
    const load = async () => {
      try {
        const [ex, bd] = await Promise.all([client.expiries(), client.board({ product, maxDays: 90 })])
        if (cancelled) return
        setExpiries(ex)
        setBoard(bd)
        setLoadErr(null)
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : String(e))
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [client, product])

  useEffect(() => { client?.faucetInfo().then(setFaucet) }, [client])
  useEffect(() => { setAmount(product === 'sell_sol' ? '1' : '100') }, [product])
  useEffect(() => { setStrike(null); setFlow({ step: 'idle' }); lastQuote.current = null }, [product, expiryTs])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const cells: BoardCell[] = useMemo(() => {
    const row = board?.expiries.find((r) => r.expiry_ts === expiryTs)
    return row ? [...row.quotes].sort((a, b) => b.apr_pct - a.apr_pct) : []
  }, [board, expiryTs])
  const cell = cells.find((c) => c.fixed_price === strike) ?? null

  // Binding quote for the connected wallet, re-requested when inputs change or the quote expires.
  const busy = ['signing', 'cosigning', 'broadcasting', 'confirming', 'done'].includes(flow.step)
  const requestQuote = useCallback(async () => {
    if (!client || !publicKey || !expiryTs || strike === null || qty <= 0) return
    const nonce = randomNonce()
    const fixedPrice = priceToBase(strike)
    setFlow((f) => (f.step === 'quoted' ? f : { step: 'quoting' }))
    try {
      const res = await client.rfq({ product, fixedPrice, expiryTs, amount: amountBase, userPubkey: publicKey.toBase58(), nonce })
      if (res.type === 'rfq_decline') { lastQuote.current = null; setFlow({ step: 'declined', reason: res.reason }); return }
      const q: Extract<Flow, { step: 'quoted' }> = { step: 'quoted', quote: res, nonce, fixedPrice, amount: amountBase, expiryTs, product }
      lastQuote.current = q
      setFlow(q)
    } catch (e) {
      setFlow({ step: 'error', message: `Quote failed: ${friendly(e)}` })
    }
  }, [client, publicKey, expiryTs, strike, qty, product, amountBase])

  useEffect(() => {
    if (busy) return
    if (!connected || strike === null || qty <= 0) { if (!busy) setFlow({ step: 'idle' }); return }
    const id = setTimeout(requestQuote, 450)
    return () => clearTimeout(id)
  }, [connected, strike, qty, requestQuote, busy])

  useEffect(() => {
    if (flow.step === 'quoted' && now > flow.quote.valid_until && document.visibilityState === 'visible') requestQuote()
  }, [now, flow, requestQuote])

  const quote = flow.step === 'quoted' ? flow.quote : null
  const yieldHuman = quote
    ? product === 'sell_sol' ? lamportsToSol(BigInt(quote.yield_amount)) : baseToUsdc(BigInt(quote.yield_amount))
    : cell ? (cell.yield_pct / 100) * qty : null
  const apr = quote?.apr_pct ?? cell?.apr_pct ?? null
  const ttl = quote ? Math.max(0, Math.ceil((quote.valid_until - now) / 1000)) : null
  const balance = product === 'sell_sol' ? balances.sol : balances.usdc
  const insufficient = connected && balance !== null && qty > balance
  const capUsed = health && expiryTs ? (health.exposure.perExpiry[String(expiryTs)]?.onChainUsd ?? 0) + (health.exposure.perExpiry[String(expiryTs)]?.reservedUsd ?? 0) : 0
  const capPct = health ? Math.min(100, (capUsed / health.exposure.capPerExpiryUsd) * 100) : 0

  const submit = async () => {
    if (!connected || !publicKey) { setVisible(true); return }
    if (!client || !health) return
    if (!signTransaction) { setFlow({ step: 'error', message: 'This wallet cannot sign transactions.' }); return }
    if (flow.step !== 'quoted') return
    const q = flow
    try {
      setFlow({ step: 'signing' })
      const mm = new PublicKey(q.quote.mm_pubkey)
      const tx = await buildOpenPositionTx(connection, {
        user: publicKey, mm, usdcMint: new PublicKey(health.usdc_mint), product: q.product,
        fixedPrice: q.fixedPrice, expiryTs: q.expiryTs, amount: q.amount, yieldAmount: BigInt(q.quote.yield_amount), nonce: q.nonce,
      })
      const signed = await signTransaction(tx)
      const userSigned = Buffer.from(signed.serialize({ requireAllSignatures: false, verifySignatures: false })).toString('base64')
      setFlow({ step: 'cosigning' })
      const res = await client.sign(userSigned)
      if (res.type === 'sign_rejection') throw new Error(`Desk declined to co-sign: ${res.reason}`)
      const full = Transaction.from(Buffer.from(res.tx_base64, 'base64'))
      let signature = res.signature
      if (!signature) {
        setFlow({ step: 'broadcasting' })
        signature = await connection.sendRawTransaction(full.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' })
      }
      setFlow({ step: 'confirming', signature })
      const bh = await connection.getLatestBlockhash('confirmed')
      const conf = await connection.confirmTransaction({ signature, ...bh }, 'confirmed')
      if (conf.value.err) throw new Error(`Transaction failed on chain: ${JSON.stringify(conf.value.err)}`)
      const position = positionPda(publicKey, mm, q.fixedPrice, q.expiryTs, q.nonce).toBase58()
      setFlow({ step: 'done', signature, position })
      balances.refresh()
    } catch (e) {
      setFlow({ step: 'error', message: friendly(e) })
    }
  }

  const claimFaucet = async () => {
    if (!client || !publicKey) { setVisible(true); return }
    setFaucetMsg('Minting test USDC…')
    try {
      const r = await client.faucet(publicKey.toBase58())
      setFaucetMsg(`Minted ${r.usdc_amount} test USDC${r.sol_airdrop_signature ? ' and requested a SOL airdrop' : ''}.`)
      setTimeout(balances.refresh, 2500)
    } catch (e) {
      setFaucetMsg(friendly(e))
    }
  }

  const reset = () => { setFlow({ step: 'idle' }); lastQuote.current = null; setStrike(null) }
  const label = expiryTs ? expiryShort(expiryTs) : '…'
  const under = 'SOL'

  return (
    <section className="page">
      <PageTitle>Earn yield upfront</PageTitle>
      <Terminal title={`~/earn/SOL/${collateral}/${label}`}>
        <div className="ed-head">
          <HeaderChips
            asset="SOL"
            type={type}
            extra={
              <Dropdown
                label="Expiry"
                value={expiryTs ? String(expiryTs) : ''}
                options={expiries.map((e) => ({ id: String(e.expiry_ts), label: `${expiryShort(e.expiry_ts)} · ${Math.round(e.days)}d` }))}
                onChange={(id) => navigate(marketHref(findMarket('SOL', type), id))}
              />
            }
          />
          <div className="ed-head-group">
            <span className="ed-price" title="Deribit sol_usdc index, the price the program settles against">{spot ? fmtPrice(spot) : '—'}</span>
            <div className="gauge" title={health ? `${capUsed.toFixed(0)} of ${health.exposure.capPerExpiryUsd} USD desk capacity used for this expiry` : 'Desk capacity'}>
              <div className="gauge-arc" style={{ ['--deg' as string]: `${(capPct / 100) * 180}deg` }} />
              <small>{capPct.toFixed(0)}% of cap</small>
            </div>
          </div>
        </div>

        <div className="ed-body">
          {status === 'offline' && (
            <div className="notice warn">
              Market-maker desk unreachable. Start <code>MM-system/breezepocket-mm</code> (<code>npm start</code>) and reload, or point this page at a desk with <code>?mm=https://…</code>.
            </div>
          )}
          {loadErr && status === 'online' && <div className="notice warn">Desk error: {loadErr}</div>}

          <div className="ed-prompt">
            <span>
              Choose the price at which you are happy to {type === 'call' ? 'sell' : 'buy'} SOL on {expiryTs ? expiryLong(expiryTs) : '…'}
              {expiryTs && ` (in ${Math.max(1, Math.ceil((expiryTs * 1000 - now) / 86_400_000))} days)`}
            </span>
          </div>

          <ul className="strikes">
            {cells.map((c) => (
              <li key={c.fixed_price} className={`strike ${strike === c.fixed_price ? 'is-selected' : ''}`} data-tone={tone(c.apr_pct)}>
                <small className="strike-tag"><span>APR</span><span>{c.apr_pct.toFixed(2)}%</span></small>
                <button type="button" className="strike-btn" disabled={busy} onClick={() => setStrike(c.fixed_price)} title={c.instrument ?? c.price_source}>
                  <strong>{fmtPrice(c.fixed_price)}</strong>
                </button>
              </li>
            ))}
            {!cells.length && status === 'online' && <li className="strikes-empty">Loading live strikes from the desk…</li>}
          </ul>

          <div className="amount">
            <div className="amount-left">
              <small className="amount-max" onClick={() => balance !== null && setAmount(String(Math.max(0, product === 'sell_sol' ? Math.floor((balance - 0.01) * 1e4) / 1e4 : Math.floor(balance * 100) / 100)))}>MAX</small>
              <div className="amount-steps">
                <button type="button" onClick={() => setAmount((a) => String(+((parseFloat(a) || 0) + (product === 'sell_sol' ? 0.1 : 10)).toFixed(4)))} aria-label="Increase">+</button>
                <button type="button" onClick={() => setAmount((a) => String(Math.max(0, +((parseFloat(a) || 0) - (product === 'sell_sol' ? 0.1 : 10)).toFixed(4))))} aria-label="Decrease">-</button>
              </div>
              <input id="quantity" name="quantity" inputMode="decimal" autoComplete="off" placeholder="amount to deposit" value={amount} disabled={busy}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
            </div>
            <div className="amount-right">
              <div>
                <label htmlFor="quantity">{collateral}</label>
                <small>{connected && balance !== null ? fmtNum(balance, product === 'sell_sol' ? 4 : 2) : '—'}</small>
              </div>
              <div className="coin">
                <img src={iconFor(collateral)} alt="" />
                <img src={CHAINS[SOLANA].icon} alt="" />
              </div>
            </div>
          </div>
          <div className="amount-foot">
            <small className="warn" style={{ opacity: insufficient ? 1 : 0 }}>INSUFFICIENT BALANCE</small>
            {faucet?.enabled && (
              <button type="button" className="faucet-btn" onClick={claimFaucet} title={`Mints ${faucet.amount_usdc} test USDC and requests devnet SOL for your wallet`}>
                <small>GET TEST USDC + SOL</small>
              </button>
            )}
          </div>
          {faucetMsg && <div className="notice">{faucetMsg}</div>}

          <div className="payoff">
            <div className="payoff-bar"><span>Now</span></div>
            <div className="payoff-now">
              <div className="payoff-apr">
                <span><span className="big">{apr !== null ? `${apr.toFixed(2)}%` : '--'}</span> APR</span>
                <span>
                  {yieldHuman !== null && qty > 0
                    ? `${fmtNum(yieldHuman, product === 'sell_sol' ? 6 : 2)} ${collateral} upfront${quote ? '' : ' (indicative)'}`
                    : 'Select a price to see your premium'}
                </span>
                {quote && (
                  <small className="quote-meta">
                    Binding quote · {quote.instrument ?? quote.price_source} · desk fee {quote.fee_pct ?? '—'}% · valid {ttl}s
                  </small>
                )}
              </div>
              <ul className="payoff-legend" aria-hidden="true">
                {cells.map((c) => <li key={c.fixed_price} className={strike !== null && c.apr_pct >= (cell?.apr_pct ?? Infinity) ? 'on' : ''} />)}
              </ul>
            </div>
            <div className="payoff-bar"><span>On {label}</span></div>
            <div className="payoff-out">
              {product === 'sell_sol' ? (
                <>
                  <div>
                    <small>If {under} <b>BELOW</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor('SOL')} alt="" />Get {fmtNum(qty, 4)} SOL back</strong>
                  </div>
                  <div>
                    <small>If {under} <b>ABOVE</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor('USDC')} alt="" />Receive {strike ? fmtNum(qty * strike) : '--'} USDC</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <small>If {under} <b>ABOVE</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor('USDC')} alt="" />Get {fmtNum(qty)} USDC back</strong>
                  </div>
                  <div>
                    <small>If {under} <b>BELOW</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor('SOL')} alt="" />Receive {strike ? fmtNum(qty / strike, 4) : '--'} SOL</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          <FlowStatus flow={flow} onReset={reset} />

          <div className="ed-cta">
            {flow.step === 'done' ? (
              <Link className="btn btn-primary" to="/dashboard">View position in dashboard</Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || status !== 'online' || strike === null || qty <= 0 || (connected && (flow.step !== 'quoted' || insufficient))}
                onClick={submit}
              >
                {status !== 'online' ? 'Desk offline'
                  : strike === null ? 'Select price'
                  : !connected ? 'Connect wallet to continue'
                  : insufficient ? 'Insufficient balance'
                  : flow.step === 'quoting' ? 'Getting quote…'
                  : flow.step === 'declined' ? 'Quote declined'
                  : flow.step === 'signing' ? 'Sign in your wallet…'
                  : flow.step === 'cosigning' ? 'Desk co-signing…'
                  : flow.step === 'broadcasting' ? 'Broadcasting…'
                  : flow.step === 'confirming' ? 'Confirming on devnet…'
                  : 'Earn upfront premium now'}
              </button>
            )}
          </div>
        </div>
      </Terminal>
    </section>
  )
}

/* ---------------------------------------------------------------------------------------- */

/**
 * A market the desk prices but the program cannot settle (the tokenized equities, priced from
 * US listed options via Alpaca). Same strike ladder and payoff preview as SOL, but read-only:
 * there is no RFQ and no transaction, because the desk declines to trade anything but SOL.
 */
function QuoteOnlyMarket({ asset, type, expiryParam }: { asset: string; type: OptionType; expiryParam: number | null }) {
  const navigate = useNavigate()
  const product = productForType(type)
  const { client, health, status } = useDesk()
  const desk = health?.assets?.find((a) => a.asset === asset) ?? null
  const quoted = desk !== null

  const [expiries, setExpiries] = useState<DeskExpiry[]>([])
  const [board, setBoard] = useState<Board | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [strike, setStrike] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!client || !quoted) return
    let cancelled = false
    const load = async () => {
      try {
        const [ex, bd] = await Promise.all([client.expiries(asset), client.board({ asset, product, maxDays: 90 })])
        if (cancelled) return
        setExpiries(ex)
        setBoard(bd)
        setLoadErr(null)
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : String(e))
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [client, quoted, asset, product])

  const expiryTs = expiryParam && expiries.some((e) => e.expiry_ts === expiryParam) ? expiryParam : expiries[0]?.expiry_ts ?? null
  useEffect(() => { setStrike(null) }, [product, expiryTs, asset])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const cells: BoardCell[] = useMemo(() => {
    const row = board?.expiries.find((r) => r.expiry_ts === expiryTs)
    return row ? [...row.quotes].sort((a, b) => b.apr_pct - a.apr_pct) : []
  }, [board, expiryTs])

  // Once the desk has answered, an asset it does not price is simply not live yet.
  if (status !== 'connecting' && !quoted) return <ComingSoon asset={asset} type={type} />

  const cell = cells.find((c) => c.fixed_price === strike) ?? null
  const under = desk?.underlying ?? asset
  const spot = desk?.spot ?? board?.index_price ?? null
  const collateral = type === 'call' ? asset : 'USDC'
  // The board prices a fixed size: 1 unit of the asset (9 decimals) for calls, 100 USDC for puts.
  const size = board ? (product === 'sell_sol' ? Number(board.amount) / 1e9 : Number(board.amount) / 1e6) : product === 'sell_sol' ? 1 : 100
  const premium = cell ? (product === 'sell_sol' ? Number(cell.yield_amount) / 1e9 : Number(cell.yield_amount) / 1e6) : null
  const premiumUsd = premium !== null ? (product === 'sell_sol' && spot ? premium * spot : premium) : null
  const label = expiryTs ? expiryShort(expiryTs) : '…'

  return (
    <section className="page">
      <PageTitle>Earn yield upfront</PageTitle>
      <Terminal title={`~/earn/${asset}/${collateral}/${label}`}>
        <div className="ed-head">
          <HeaderChips
            asset={asset}
            type={type}
            extra={
              <Dropdown
                label="Expiry"
                value={expiryTs ? String(expiryTs) : ''}
                options={expiries.map((e) => ({ id: String(e.expiry_ts), label: `${expiryShort(e.expiry_ts)} · ${Math.round(e.days)}d` }))}
                onChange={(id) => navigate(marketHref(findMarket(asset, type), id))}
              />
            }
          />
          <div className="ed-head-group">
            <span className="tag-quote" title="Live indicative quote; not tradable on devnet">QUOTE</span>
            <span className="ed-price" title={`${under} spot, from Alpaca`}>{spot ? fmtPrice(spot) : '—'}</span>
          </div>
        </div>

        <div className="ed-body">
          {status === 'offline' && <div className="notice warn">Market-maker desk unreachable, so there are no live quotes right now.</div>}
          {loadErr && status === 'online' && <div className="notice warn">Desk error: {loadErr}</div>}
          <div className="notice">
            <b>Quote only.</b> Live indicative prices from {under} listed options via Alpaca
            {desk?.atm_vol ? `, ~30-day implied vol ${(desk.atm_vol * 100).toFixed(1)}%` : ''}. The devnet program settles SOL alone, so a {asset} position
            cannot be opened yet.
          </div>

          <div className="ed-prompt">
            <span>
              Prices at which you could {type === 'call' ? 'sell' : 'buy'} {asset} on {expiryTs ? expiryLong(expiryTs) : '…'}
              {expiryTs && ` (in ${Math.max(1, Math.ceil((expiryTs * 1000 - now) / 86_400_000))} days)`}
            </span>
          </div>

          <ul className="strikes">
            {cells.map((c) => (
              <li key={c.fixed_price} className={`strike ${strike === c.fixed_price ? 'is-selected' : ''}`} data-tone={tone(c.apr_pct)}>
                <small className="strike-tag"><span>APR</span><span>{c.apr_pct.toFixed(2)}%</span></small>
                <button type="button" className="strike-btn" onClick={() => setStrike(c.fixed_price)} title={c.instrument ?? c.price_source}>
                  <strong>{fmtPrice(c.fixed_price)}</strong>
                </button>
              </li>
            ))}
            {!cells.length && status !== 'offline' && <li className="strikes-empty">Loading live strikes from the desk…</li>}
          </ul>

          <div className="payoff">
            <div className="payoff-bar"><span>Now</span></div>
            <div className="payoff-now">
              <div className="payoff-apr">
                <span><span className="big">{cell ? `${cell.apr_pct.toFixed(2)}%` : '--'}</span> APR</span>
                <span>
                  {premium !== null
                    ? `${fmtNum(premium, product === 'sell_sol' ? 6 : 2)} ${collateral} upfront on ${fmtNum(size, 0)} ${collateral}` +
                      (product === 'sell_sol' && premiumUsd !== null ? ` (≈ ${fmtPrice(premiumUsd)})` : '') + ' · indicative'
                    : 'Select a price to see the premium'}
                </span>
                {cell && <small className="quote-meta">{cell.instrument ?? cell.price_source} · implied vol {(cell.implied_vol * 100).toFixed(1)}%{board ? ` · desk fee ${board.fee_pct}%` : ''}</small>}
              </div>
              <ul className="payoff-legend" aria-hidden="true">
                {cells.map((c) => <li key={c.fixed_price} className={strike !== null && c.apr_pct >= (cell?.apr_pct ?? Infinity) ? 'on' : ''} />)}
              </ul>
            </div>
            <div className="payoff-bar"><span>On {label}</span></div>
            <div className="payoff-out">
              {product === 'sell_sol' ? (
                <>
                  <div>
                    <small>If {under} <b>BELOW</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor(asset)} alt="" />Get {fmtNum(size, 0)} {asset} back</strong>
                  </div>
                  <div>
                    <small>If {under} <b>ABOVE</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor('USDC')} alt="" />Receive {strike ? fmtNum(size * strike) : '--'} USDC</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <small>If {under} <b>ABOVE</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor('USDC')} alt="" />Get {fmtNum(size)} USDC back</strong>
                  </div>
                  <div>
                    <small>If {under} <b>BELOW</b> {strike ? fmtPrice(strike) : '--'}</small>
                    <strong><img src={iconFor(asset)} alt="" />Receive {strike ? fmtNum(size / strike, 4) : '--'} {asset}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="ed-cta">
            <button type="button" className="btn btn-primary" disabled title="The devnet program settles SOL only">
              Quote only · not tradable on devnet
            </button>
          </div>
        </div>
      </Terminal>
    </section>
  )
}

function FlowStatus({ flow, onReset }: { flow: Flow; onReset: () => void }) {
  if (flow.step === 'declined') return <div className="notice warn">Desk declined this quote: {flow.reason}</div>
  if (flow.step === 'error') return <div className="notice warn">{flow.message} <button type="button" className="link-btn" onClick={onReset}>Try again</button></div>
  if (flow.step === 'confirming') return <div className="notice">Waiting for devnet confirmation · <a href={explorerTx(flow.signature)} target="_blank" rel="noopener noreferrer">view transaction</a></div>
  if (flow.step === 'done') {
    return (
      <div className="notice ok">
        Position opened and yield paid upfront. <a href={explorerTx(flow.signature)} target="_blank" rel="noopener noreferrer">Transaction</a> · <a href={explorerAddr(flow.position)} target="_blank" rel="noopener noreferrer">Position account</a>
        {' '}· <button type="button" className="link-btn" onClick={onReset}>Open another</button>
      </div>
    )
  }
  return null
}

export { productLabel }
