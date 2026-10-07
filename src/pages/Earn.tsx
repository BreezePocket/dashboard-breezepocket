import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import Panel from '../components/Panel'
import Dropdown from '../components/Dropdown'
import { FilterIcon, Chevron } from '../components/Icons'
import { useDesk } from '../components/DeskProvider'
import { CALLS, PUTS, CHAINS, iconFor, marketHref, isPreStocks, assetName, categoryOf, CATEGORIES, type Category, type ChainId, type Market } from '../data/markets'
import { isBackend, priceSource, type Board, type Product } from '../lib/mm'

type Tab = 'call' | 'put'
type GroupBy = 'category' | 'chain'
/** live: tradable on chain · quote: the desk streams a live price but cannot trade it · soon: neither. */
type State = 'live' | 'quote' | 'soon'
/** maxApr/minApr are the desk's live range, null when it is not quoting this market. */
type Row = Market & { state: State; underlying: string | null; venue: string | null; maxApr: number | null; minApr: number | null }
const STATE_ORDER: Record<State, number> = { live: 0, quote: 1, soon: 2 }

const TABS = [
  { id: 'put' as Tab, label: 'Start Accumulating Cheap Asset' },
  { id: 'call' as Tab, label: 'Sell High Your Asset' },
]
const CHAIN_OPTIONS = [
  { id: 'all', label: 'All Chains', icons: Object.values(CHAINS).map((c) => c.icon) },
  ...Object.entries(CHAINS).map(([id, c]) => ({ id, label: c.name, icon: c.icon })),
]
const GROUP_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: 'category', label: 'Asset Type' },
  { id: 'chain', label: 'Chain' },
]
const PRODUCT: Record<Tab, Product> = { call: 'sell_sol', put: 'buy_sol' }

/** Highest and lowest APR the desk is paying right now across every expiry and strike. */
const aprRange = (b: Board | null) => {
  const aprs = b?.expiries.flatMap((e) => e.quotes.map((q) => q.apr_pct)) ?? []
  return aprs.length ? { max: Math.max(...aprs), min: Math.min(...aprs) } : null
}

export default function Earn() {
  const [tab, setTab] = useState<Tab>('put')
  const [chain, setChain] = useState('all')
  const [cats, setCats] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('category')
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { client, health, status } = useDesk()
  const navigate = useNavigate()
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
    if (chain !== 'all') src = src.filter((m) => String(m.chainId) === chain)
    if (cats.length) src = src.filter((m) => cats.includes(categoryOf(m.asset)))
    const q = query.trim().toLowerCase()
    if (q) src = src.filter((m) => m.asset.toLowerCase().includes(q) || assetName(m.asset).toLowerCase().includes(q))
    // Markets with a live price come first; Array.sort is stable, so each group keeps its order.
    return [...src].sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state])
  }, [tab, chain, cats, query, boards, quoted])

  // Each group keeps the order above.
  const groups = useMemo<{ key: string; label: string; icon?: string; rows: Row[] }[]>(() => {
    if (groupBy === 'category')
      return CATEGORIES.map((c) => ({ key: c.id, label: c.label, rows: rows.filter((m) => categoryOf(m.asset) === c.id) })).filter((g) => g.rows.length)
    return (Object.keys(CHAINS).map(Number) as ChainId[])
      .map((id) => ({ key: String(id), label: CHAINS[id].name, icon: CHAINS[id].icon, rows: rows.filter((m) => m.chainId === id) }))
      .filter((g) => g.rows.length)
  }, [rows, groupBy])

  const toggleCat = (id: Category) => setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))


  // The cap bar is the desk's real aggregate exposure against its hard notional cap; the
  // backend sums both over every market maker online (all zero when none is).
  const cap = health && health.exposure.capTotalUsd > 0 ? Math.min(100, (health.exposure.totalUsd / health.exposure.capTotalUsd) * 100) : 0
  // Without live figures the row says why instead: offline, still connecting, or no quotes.
  const capNote = !health
    ? status === 'offline' ? 'Market-maker backend offline' : 'Connecting…'
    : isBackend(health) && !health.ok ? 'No live quotes right now' : null
  const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  const capText = capNote ?? (
    <>
      <b>{cap.toFixed(2)}%</b> {health && isBackend(health) ? 'of market-maker capacity used' : 'of desk cap used'}
      <i>·</i>
      <b>{usd(health!.exposure.totalUsd)}</b> of {usd(health!.exposure.capTotalUsd)}
    </>
  )

  return (
    <section className="page">
      <PageTitle>Get paid while you wait</PageTitle>
      <Panel label="Strategy" tabs={{ items: TABS, active: tab, onChange: (id) => setTab(id as Tab) }}>
        {/* One bar with its reading inside. The text is drawn twice, dark on the track and
            white on the fill, and the white copy is cut to the fill's width, so it stays
            readable wherever the fill ends. */}
        <div className="cap">
          <div
            className="cap-track"
            role="progressbar"
            aria-label="Market-maker capacity used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(cap)}
            style={{ ['--cap' as string]: `${health && !capNote ? cap : 0}%` }}
          >
            <span className="cap-text">{capText}</span>
            <span className="cap-text cap-fill" aria-hidden="true">{capText}</span>
          </div>
        </div>
        <div className="filter-bar">
          <Dropdown label="Chain" options={CHAIN_OPTIONS} value={chain} onChange={setChain} />
          <div className="chip-wrap" ref={menuRef}>
            <button type="button" className={`chip ${cats.length ? 'on' : ''}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
              <FilterIcon />
              <span>Assets{cats.length ? ` · ${cats.length}` : ''}</span>
              <Chevron />
            </button>
            {menu && (
              <div className="chip-menu" role="menu">
                {CATEGORIES.map((c) => (
                  <button key={c.id} type="button" role="menuitemcheckbox" aria-checked={cats.includes(c.id)} className={cats.includes(c.id) ? 'on' : ''} onClick={() => toggleCat(c.id)}>{c.label}</button>
                ))}
                {cats.length > 0 && <button type="button" role="menuitem" className="chip-clear" onClick={() => setCats([])}>Clear</button>}
              </div>
            )}
          </div>
          <input className="filter-search" type="search" placeholder="Filter Assets" aria-label="Filter assets" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Dropdown label="Group by" prefix="Group By: " options={GROUP_OPTIONS} value={groupBy} onChange={(id) => setGroupBy(id as GroupBy)} />
        </div>
        <div className="tbl-wrap">
          {/* Column widths live in the stylesheet (.tbl-earn): fixed APR and action columns, so
              nothing shifts between the two tabs, narrowing with the screen so the table never scrolls sideways. */}
          <div className="tbl tbl-earn">
            <div className="tbl-h sticky" role="columnheader">
              Asset
            </div>
            <div className="tbl-h" role="columnheader">
              Chain
            </div>
            <div className="tbl-h end" role="columnheader">
              Max APR
            </div>
            <div className="tbl-h end" role="columnheader">
              Min APR
            </div>
            <div className="tbl-h end" role="columnheader" />

            {rows.length === 0 && <div className="tbl-empty">No assets match these filters.</div>}
            {groups.flatMap((g) => [
              <div className="tbl-group" key={`group-${g.key}`}>
                {g.icon && <img src={g.icon} alt="" />}
                <b>{g.label}</b>
                <span>{g.rows.length}</span>
              </div>,
              ...g.rows.map((m) => {
              const chain = CHAINS[m.chainId]
              const label = tab === 'call' ? `Sell High Your ${m.asset}` : `Buy Low with ${m.collateral}`
              const btnIcon = tab === 'call' ? iconFor(m.asset) : iconFor(m.collateral)
              const soon = m.state === 'soon'
              // Live rows open the market from the asset cell too, like the button.
              const AssetCell = (soon ? 'div' : Link) as React.ElementType
              // Only the desk's live quotes: a dash while it is not quoting this market.
              const apr = (v: number | null) => (v !== null && Number.isFinite(v) ? `${v.toFixed(2)}%` : '—')
              // The whole row opens the market; the links inside keep it reachable by keyboard.
              return (
                <ul
                  className={`tbl-row ${soon ? 'is-soon' : 'is-live'}`}
                  key={`${m.asset}-${m.collateral}-${m.type}`}
                  onClick={soon ? undefined : (e) => { if (!(e.target as HTMLElement).closest('a')) navigate(marketHref(m)) }}
                >
                  <li className="tbl-c sticky">
                    <AssetCell className="asset" {...(soon ? {} : { to: marketHref(m), 'aria-label': label })}>
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
                    </AssetCell>
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
              }),
            ])}
          </div>
        </div>
      </Panel>
    </section>
  )
}
