import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import Tabs from '../components/Tabs'
import { SortIcon, FilterIcon } from '../components/Icons'
import { useDesk } from '../components/DeskProvider'
import { CALLS, PUTS, CHAINS, iconFor, marketHref, isRwa, isPreStocks, assetName, type Market } from '../data/markets'
import { priceSource, type Board, type Product } from '../lib/mm'

type Tab = 'call' | 'put'
type SortKey = 'asset' | 'chain' | 'maxApr' | 'minApr'
type AssetClass = 'all' | 'rwa' | 'crypto'
/** live: tradable on chain · quote: the desk streams a live price but cannot trade it · soon: neither. */
type State = 'live' | 'quote' | 'soon'
/** maxApr/minApr are the desk's live range, null when it is not quoting this market. */
type Row = Market & { state: State; underlying: string | null; venue: string | null; maxApr: number | null; minApr: number | null }
const STATE_ORDER: Record<State, number> = { live: 0, quote: 1, soon: 2 }

const TABS = [
  { id: 'put' as Tab, label: 'Start Accumulating Cheap Asset' },
  { id: 'call' as Tab, label: 'Sell High Your Asset' },
]
const CLASSES: { id: AssetClass; label: string }[] = [
  { id: 'all', label: 'all assets' },
  { id: 'rwa', label: 'RWAs only' },
  { id: 'crypto', label: 'crypto only' },
]
const PRODUCT: Record<Tab, Product> = { call: 'sell_sol', put: 'buy_sol' }

/** Highest and lowest APR the desk is paying right now across every expiry and strike. */
const aprRange = (b: Board | null) => {
  const aprs = b?.expiries.flatMap((e) => e.quotes.map((q) => q.apr_pct)) ?? []
  return aprs.length ? { max: Math.max(...aprs), min: Math.min(...aprs) } : null
}

export default function Earn() {
  const [tab, setTab] = useState<Tab>('put')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)
  const [cls, setCls] = useState<AssetClass>('all')
  const [onlyPre, setOnlyPre] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { client, health, status } = useDesk()
  // Boards keyed `${asset}:${product}`, for every asset the desk prices.
  const [boards, setBoards] = useState<Record<string, Board>>({})
  const quoted = useMemo(() => new Map((health?.assets ?? []).map((a) => [a.asset, a])), [health])
  // A stable key so the board fetch reruns when the desk's asset list changes, not on every /health poll.
  const quotedKey = [...quoted.keys()].join(',')

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  // Live yields for every asset the desk prices, both products, refreshed every 60s.
  // The desk serves these from cached surfaces, so the fan-out costs it no upstream calls.
  useEffect(() => {
    if (!client || !quotedKey) return
    let cancelled = false
    const pairs = quotedKey.split(',').flatMap((a) => (['sell_sol', 'buy_sol'] as Product[]).map((p) => [a, p] as const))
    const load = async () => {
      const got = await Promise.all(
        pairs.map(([asset, product]) =>
          client.board({ asset, product, maxDays: 90 }).then((b): [string, Board] => [`${asset}:${product}`, b]).catch(() => null),
        ),
      )
      if (!cancelled) setBoards(Object.fromEntries(got.filter((g): g is [string, Board] => g !== null)))
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [client, quotedKey])

  const rows = useMemo<Row[]>(() => {
    let src: Row[] = (tab === 'call' ? CALLS : PUTS).map((m) => {
      const desk = quoted.get(m.asset)
      if (!desk) return { ...m, state: 'soon', underlying: null, venue: null, maxApr: null, minApr: null }
      const range = aprRange(boards[`${m.asset}:${PRODUCT[tab]}`] ?? null)
      return {
        ...m,
        state: desk.tradable ? 'live' : 'quote',
        underlying: desk.underlying,
        venue: desk.venue,
        maxApr: range?.max ?? null,
        minApr: range?.min ?? null,
      }
    })
    if (cls !== 'all') src = src.filter((m) => isRwa(m.asset) === (cls === 'rwa'))
    if (onlyPre) src = src.filter((m) => isPreStocks(m.asset))
    // Unsorted, markets with a live price come first; Array.sort is stable, so each group keeps its order.
    if (!sort) return [...src].sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state])
    if (sort.key === 'maxApr' || sort.key === 'minApr') {
      // Unquoted markets have no APR, so they stay at the bottom in either direction.
      const k = sort.key
      return [...src].sort((a, b) => (a[k] === null ? (b[k] === null ? 0 : 1) : b[k] === null ? -1 : (a[k] - b[k]) * sort.dir))
    }
    const val = (m: Row) => (sort.key === 'asset' ? m.asset.toLowerCase() : CHAINS[m.chainId].name)
    return [...src].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir)
  }, [tab, sort, cls, onlyPre, boards, quoted])

  const toggleSort = (key: SortKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  // The cap bar is the desk's real aggregate exposure against its hard notional cap.
  const cap = health ? Math.min(100, (health.exposure.totalUsd / health.exposure.capTotalUsd) * 100) : 0

  return (
    <section className="page">
      <PageTitle>Earn yield upfront</PageTitle>
      <Terminal title="~/assets">
        <div className="strip">
          <div className="strip-track">
            <div className="cap-fill" style={{ width: `${cap}%` }} />
            <span className="cap-label">
              {health ? `${cap.toFixed(2)}% of desk cap used · $${health.exposure.totalUsd.toFixed(0)} of $${health.exposure.capTotalUsd.toLocaleString()} on devnet` : status === 'offline' ? 'market-maker desk offline' : 'connecting to desk…'}
            </span>
          </div>
        </div>
        <div className="tabs-row">
          <Tabs items={TABS} active={tab} onChange={setTab} fit />
          <label className="only-pre">
            <input type="checkbox" checked={onlyPre} onChange={(e) => setOnlyPre(e.target.checked)} />
            Show only preStocks
          </label>
        </div>
        <div className="tbl-wrap">
          <div className="tbl" style={{ gridTemplateColumns: 'minmax(max-content, 1fr) minmax(max-content, 2fr) minmax(125px, max-content) minmax(125px, max-content) max-content' }}>
            <div className="tbl-h sticky" role="columnheader">
              <button type="button" onClick={() => toggleSort('asset')} style={{ display: 'flex', alignItems: 'center' }}><SortIcon />Asset</button>
              <div className="filter-wrap" ref={menuRef}>
                <button type="button" className={`filter-btn ${cls !== 'all' ? 'on' : ''}`} aria-label="Filter assets" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><FilterIcon /></button>
                {menu && (
                  <div className="filter-menu" role="menu">
                    {CLASSES.map((c) => (
                      <button key={c.id} type="button" role="menuitemradio" aria-checked={cls === c.id} className={cls === c.id ? 'on' : ''} onClick={() => { setCls(c.id); setMenu(false) }}>{c.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="tbl-h" role="columnheader">
              <button type="button" onClick={() => toggleSort('chain')} style={{ display: 'flex', alignItems: 'center' }}><SortIcon />Chain</button>
            </div>
            <div className="tbl-h end" role="columnheader">
              <button type="button" onClick={() => toggleSort('maxApr')} style={{ display: 'flex', alignItems: 'center' }}><SortIcon />Max APR</button>
            </div>
            <div className="tbl-h end" role="columnheader">
              <button type="button" onClick={() => toggleSort('minApr')} style={{ display: 'flex', alignItems: 'center' }}><SortIcon />Min APR</button>
            </div>
            <div className="tbl-h end" role="columnheader" />

            {rows.map((m) => {
              const chain = CHAINS[m.chainId]
              const label = tab === 'call' ? `Sell High Your ${m.asset} Asset` : `Buy Low with ${m.collateral}`
              const btnIcon = tab === 'call' ? iconFor(m.asset) : iconFor(m.collateral)
              const soon = m.state === 'soon'
              // Only the desk's live quotes: a dash while it is not quoting this market.
              const apr = (v: number | null) => (v !== null && Number.isFinite(v) ? `${v.toFixed(2)}%` : '—')
              return (
                <ul className={`tbl-row ${soon ? 'is-soon' : 'is-live'}`} key={`${m.asset}-${m.collateral}-${m.type}`}>
                  <li className="tbl-c sticky">
                    <div className="asset">
                      <img src={iconFor(m.asset)} alt={`The icon for ${m.asset}`} />
                      <div className="asset-id">
                        <span className="asset-tick">
                          <b>{m.asset}</b>
                          {m.state === 'quote' && (
                            <span className="tag-quote" title={`Live quote from ${priceSource(m.venue ?? '', m.underlying ?? m.asset)}. Quote only: not listed on the devnet program yet.`}>QUOTE</span>
                          )}
                          {soon && <span className="tag-soon">SOON</span>}
                          {isPreStocks(m.asset) && <span className="tag-rwa" title="Tokenized pre-IPO shares issued by PreStocks">PRE-IPO</span>}
                        </span>
                        <small>{assetName(m.asset)}</small>
                      </div>
                    </div>
                  </li>
                  <li className="tbl-c"><div className="chain"><img src={chain.icon} alt={`The icon for ${chain.name}`} /><span>{chain.name}</span></div></li>
                  <li className="tbl-c end"><span className={`apr ${soon ? 'apr-soon' : ''}`}>{apr(m.maxApr)}</span></li>
                  <li className="tbl-c end"><span className={`apr ${soon ? 'apr-soon' : ''}`}>{apr(m.minApr)}</span></li>
                  <li className="tbl-c end">
                    {!soon ? (
                      <Link className="btn-earn" to={marketHref(m)}><span className="ic"><img src={btnIcon} alt="" /></span>{label}</Link>
                    ) : (
                      <span className="btn-earn is-soon" title="Not yet listed on the devnet program"><span className="ic"><img src={btnIcon} alt="" /></span>Coming soon</span>
                    )}
                  </li>
                </ul>
              )
            })}
          </div>
          {rows.length === 0 && <div className="term-empty">~/assets: no markets match this filter</div>}
        </div>
      </Terminal>
    </section>
  )
}
