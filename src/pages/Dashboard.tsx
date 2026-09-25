import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import Tabs from '../components/Tabs'
import { useDesk } from '../components/DeskProvider'
import { usePositions } from '../hooks/usePositions'
import { shortAddr } from '../components/WalletButton'
import { iconFor, fmtNum, fmtPrice } from '../data/markets'
import { DISPUTE_WINDOW_SECS, baseToUsdc, buildSettleTx, exchangeHappens, fetchConfig, lamportsToSol, priceKey, toUnits, type PositionRow, type SettlementPriceRow } from '../lib/program'
import { explorerAddr } from '../lib/config'

type Tab = 'positions' | 'total' | 'history'
const TABS = [
  { id: 'positions' as Tab, label: 'positions' },
  { id: 'total' as Tab, label: 'total' },
  { id: 'history' as Tab, label: 'history' },
]
const COLS = ['Asset', 'Chain', 'Type', 'Maturity', 'Size', 'Notional', 'Strike', 'Yield', 'Income', 'Current Price', 'Target', 'Outcome']

const dateShort = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const notionalUsd = (p: PositionRow) => (p.product === 'sell_sol' ? toUnits(p.userCollateral, p.decimals) * (Number(p.fixedPrice) / 1e6) : baseToUsdc(p.userCollateral))
/** Sell positions lock and earn the asset (SOL or a listed token); buy positions lock and earn USDC. */
const legSymbol = (p: PositionRow) => (p.product === 'sell_sol' ? p.symbol : 'USDC')
const legAmount = (p: PositionRow, n: bigint) => (p.product === 'sell_sol' ? toUnits(n, p.decimals) : baseToUsdc(n))
const legDigits = (p: PositionRow) => (p.product === 'sell_sol' ? (p.symbol === 'SOL' ? 4 : 6) : 2)
const yieldPct = (p: PositionRow) => (Number(p.yieldAmount) / Number(p.userCollateral)) * 100

type Outcome = { label: string; tone: 'open' | 'kept' | 'exchanged' | 'settled' | 'wait'; settleable: boolean }
function outcomeOf(p: PositionRow, price: SettlementPriceRow | null | undefined, nowTs: number): Outcome {
  if (p.settled) return { label: 'Settled', tone: 'settled', settleable: false }
  if (nowTs < p.expiryTs) return { label: 'Open', tone: 'open', settleable: false }
  if (!price) return { label: 'Awaiting price', tone: 'wait', settleable: false }
  const exchanged = exchangeHappens(p.product, price.price, p.fixedPrice)
  const windowOpen = price.source === 'poster' && nowTs < price.postedTs + DISPUTE_WINDOW_SECS
  const label = exchanged ? (p.product === 'sell_sol' ? 'Sold' : 'Bought') : 'Kept'
  return { label: windowOpen ? `${label} · dispute window` : label, tone: exchanged ? 'exchanged' : 'kept', settleable: !windowOpen }
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('positions')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { health } = useDesk()
  const [addrInput, setAddrInput] = useState('')
  const [settling, setSettling] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const viewing = useMemo(() => {
    const as = params.get('as')
    if (as) { try { return new PublicKey(as) } catch { /* fall through */ } }
    return publicKey
  }, [params, publicKey])
  const readOnly = !!params.get('as') && (!publicKey || !publicKey.equals(viewing!))
  const { positions, prices, loading, error, refresh } = usePositions(viewing)

  const nowTs = Math.floor(Date.now() / 1000)
  const spot = health?.price.spot ?? null
  /** Live spot per symbol from the desk, for listed assets' current price and income. */
  const spotOf = (symbol: string) => (symbol === 'SOL' ? spot : health?.assets?.find((a) => a.asset === symbol)?.spot ?? null)
  const open = positions.filter((p) => !p.settled)
  const settled = positions.filter((p) => p.settled)
  const shown = tab === 'history' ? settled : open
  const who = viewing ? `${shortAddr(viewing.toBase58())}${readOnly ? ' (read-only)' : ''}` : 'wallet not connected'

  const totals = useMemo(() => {
    // Yield and locked amounts in other listed assets are kept per symbol.
    const t = { yieldSol: 0, yieldUsdc: 0, lockedSol: 0, lockedUsdc: 0, notional: 0, yieldAssets: {} as Record<string, number> }
    for (const p of positions) {
      if (p.product === 'sell_sol' && p.symbol === 'SOL') { t.yieldSol += lamportsToSol(p.yieldAmount); if (!p.settled) t.lockedSol += lamportsToSol(p.userCollateral) }
      else if (p.product === 'sell_sol') t.yieldAssets[p.symbol] = (t.yieldAssets[p.symbol] ?? 0) + toUnits(p.yieldAmount, p.decimals)
      else { t.yieldUsdc += baseToUsdc(p.yieldAmount); if (!p.settled) t.lockedUsdc += baseToUsdc(p.userCollateral) }
      if (!p.settled) t.notional += notionalUsd(p)
    }
    return t
  }, [positions])
  const assetYieldUsd = Object.entries(totals.yieldAssets).map(([sym, n]) => { const px = spotOf(sym); return px === null ? null : n * px })
  const incomeUsd = spot && assetYieldUsd.every((v) => v !== null)
    ? totals.yieldSol * spot + totals.yieldUsdc + assetYieldUsd.reduce<number>((a, v) => a + (v ?? 0), 0)
    : null

  const byExpiry = useMemo(() => {
    const m = new Map<number, number>()
    for (const p of open) m.set(p.expiryTs, (m.get(p.expiryTs) ?? 0) + notionalUsd(p))
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [open])
  const maxBar = Math.max(1, ...byExpiry.map(([, v]) => v))

  const settle = async (p: PositionRow) => {
    if (!publicKey) { setMsg('Connect a wallet to pay the settlement fee.'); return }
    setSettling(p.address.toBase58())
    setMsg(null)
    try {
      const cfg = await fetchConfig(connection)
      const tx = await buildSettleTx(connection, publicKey, cfg.usdcMint, p)
      const sig = await sendTransaction(tx, connection)
      const bh = await connection.getLatestBlockhash('confirmed')
      await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed')
      setMsg(`Settled. Transaction ${sig.slice(0, 8)}…`)
      refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setSettling(null)
    }
  }

  return (
    <section className="page">
      <PageTitle>Dashboard</PageTitle>
      <div className="grid-2">
        <Terminal title="~/income">
          {positions.length ? (
            <div className="dash-income">
              <div className="dash-big">{incomeUsd !== null ? `$${fmtNum(incomeUsd)}` : '—'}<small>yield received upfront</small></div>
              <div className="dash-split">
                <div><img src={iconFor('SOL')} alt="" /><b>{fmtNum(totals.yieldSol, 6)}</b> SOL</div>
                <div><img src={iconFor('USDC')} alt="" /><b>{fmtNum(totals.yieldUsdc)}</b> USDC</div>
                {Object.entries(totals.yieldAssets).map(([sym, n]) => (
                  <div key={sym}><img src={iconFor(sym)} alt="" /><b>{fmtNum(n, 6)}</b> {sym}</div>
                ))}
              </div>
              <small className="dash-foot">{positions.length} position{positions.length === 1 ? '' : 's'} · {open.length} open · ${fmtNum(totals.notional, 0)} notional at target</small>
            </div>
          ) : (
            <div className="term-empty">~/income: {viewing ? (loading ? 'loading positions from devnet…' : 'no positions yet') : who}</div>
          )}
        </Terminal>
        <Terminal title="~/chart">
          {byExpiry.length ? (
            <div className="dash-chart">
              {byExpiry.map(([exp, usd]) => (
                <div key={exp} className="dash-bar-col" title={`$${fmtNum(usd)} notional expiring ${dateShort(exp)}`}>
                  <span className="dash-bar-val">${fmtNum(usd, 0)}</span>
                  <div className="dash-bar" style={{ height: `${Math.max(6, (usd / maxBar) * 160)}px` }} />
                  <small>{dateShort(exp)}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="term-empty">~/dashboard/chart: {viewing ? 'no open notional' : who}</div>
          )}
        </Terminal>
      </div>

      <Terminal title="~/positions">
        <Tabs items={TABS} active={tab} onChange={setTab} />
        {!viewing && (
          <div className="dash-lookup">
            <span>Connect a wallet, or view any address read-only:</span>
            <form onSubmit={(e) => { e.preventDefault(); if (addrInput.trim()) navigate(`/dashboard?as=${addrInput.trim()}`) }}>
              <input value={addrInput} onChange={(e) => setAddrInput(e.target.value)} placeholder="Solana address" spellCheck={false} />
              <button type="submit" className="btn" style={{ height: 36 }}>View</button>
            </form>
          </div>
        )}
        {msg && <div className="notice">{msg}</div>}
        {error && <div className="notice warn">RPC error: {error}</div>}

        {tab === 'total' ? (
          <div className="tbl-wrap">
            <div className="tbl" style={{ gridTemplateColumns: 'repeat(5, minmax(max-content, 1fr))' }}>
              {['Positions', 'Locked SOL', 'Locked USDC', 'Yield in SOL', 'Yield in USDC'].map((c, i) => <div key={c} className={`tbl-h ${i === 0 ? 'bold' : 'end'}`}>{c}</div>)}
              <ul className="tbl-row">
                <li className="tbl-c">{open.length} open · {settled.length} settled</li>
                <li className="tbl-c end">{fmtNum(totals.lockedSol, 4)}</li>
                <li className="tbl-c end">{fmtNum(totals.lockedUsdc)}</li>
                <li className="tbl-c end"><span className="apr">{fmtNum(totals.yieldSol, 6)}</span></li>
                <li className="tbl-c end"><span className="apr">{fmtNum(totals.yieldUsdc)}</span></li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <div className="tbl" style={{ gridTemplateColumns: `repeat(${COLS.length}, minmax(max-content, 1fr))` }}>
              {COLS.map((c, i) => <div key={c} className={`tbl-h ${i === 0 ? 'sticky' : 'end'} ${c === 'Income' ? 'bold' : ''}`} style={{ paddingLeft: 16, paddingRight: 16 }}>{c}</div>)}
              {shown.map((p) => {
                const price = prices[priceKey(p)]
                const o = outcomeOf(p, price, nowTs)
                const coll = `${fmtNum(legAmount(p, p.userCollateral), legDigits(p))} ${legSymbol(p)}`
                const income = `${fmtNum(legAmount(p, p.yieldAmount), p.product === 'sell_sol' ? 6 : 2)} ${legSymbol(p)}`
                const live = spotOf(p.symbol)
                return (
                  <ul className="tbl-row" key={p.address.toBase58()}>
                    <li className="tbl-c sticky" style={{ paddingLeft: 16 }}>
                      <div className="asset"><img src={iconFor(p.symbol)} alt="" /><div className="asset-id"><b>{p.symbol}</b><small><a href={explorerAddr(p.address.toBase58())} target="_blank" rel="noopener noreferrer">{shortAddr(p.address.toBase58())}</a></small></div></div>
                    </li>
                    <li className="tbl-c end"><div className="chain"><img src="/icons/solana.svg" alt="" /><span>Solana</span></div></li>
                    <li className="tbl-c end">{p.product === 'sell_sol' ? 'Sell high' : 'Buy low'}</li>
                    <li className="tbl-c end">{dateShort(p.expiryTs)}</li>
                    <li className="tbl-c end">{coll}</li>
                    <li className="tbl-c end">${fmtNum(notionalUsd(p))}</li>
                    <li className="tbl-c end">{fmtPrice(Number(p.fixedPrice) / 1e6)}</li>
                    <li className="tbl-c end"><span className="apr">{yieldPct(p).toFixed(3)}%</span></li>
                    <li className="tbl-c end"><b>{income}</b></li>
                    <li className="tbl-c end">{price ? fmtPrice(Number(price.price) / 1e6) : live ? fmtPrice(live) : '—'}</li>
                    <li className="tbl-c end">{fmtPrice(Number(p.fixedPrice) / 1e6)}</li>
                    <li className="tbl-c end">
                      <span className={`outcome outcome-${o.tone}`}>{o.label}</span>
                      {o.settleable && !p.settled && (
                        <button type="button" className="settle-btn" disabled={settling === p.address.toBase58()} onClick={() => settle(p)}>
                          {settling === p.address.toBase58() ? 'Settling…' : 'Settle'}
                        </button>
                      )}
                    </li>
                  </ul>
                )
              })}
            </div>
            {shown.length === 0 && (
              <div className="term-empty">~/dashboard/{tab}: {viewing ? (loading ? 'loading from devnet…' : tab === 'history' ? 'no settled positions' : 'no open positions') : who}</div>
            )}
          </div>
        )}
        {settled.length > 0 && tab === 'history' && (
          <div className="dash-note">Settled positions keep their account on chain; the vault rent was refunded to the market maker.</div>
        )}
      </Terminal>
    </section>
  )
}
