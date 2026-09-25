import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import Tabs from '../components/Tabs'
import { SortIcon, FilterIcon } from '../components/Icons'
import { useDesk } from '../components/DeskProvider'
import { CALLS, PUTS, CHAINS, iconFor, marketHref, isRwa, assetName, type Market } from '../data/markets'
import type { Board, Product } from '../lib/mm'

type Tab = 'call' | 'put'
type SortKey = 'asset' | 'chain' | 'maxApr' | 'minApr'
type AssetClass = 'all' | 'rwa' | 'crypto'
type Row = Market & { live: boolean }

const TABS = [
  { id: 'call' as Tab, label: 'covered calls' },
  { id: 'put' as Tab, label: 'cash secured puts' },
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
  const [tab, setTab] = useState<Tab>('call')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)
  const [cls, setCls] = useState<AssetClass>('all')
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { client, health, status } = useDesk()
  const [boards, setBoards] = useState<Partial<Record<Product, Board>>>({})

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  // Live yields for the SOL markets, refreshed every 60s.
  useEffect(() => {
    if (!client) return
    let cancelled = false
    const load = async () => {
      const [sell, buy] = await Promise.all([client.board({ product: 'sell_sol', maxDays: 90 }).catch(() => null), client.board({ product: 'buy_sol', maxDays: 90 }).catch(() => null)])
      if (!cancelled) setBoards({ sell_sol: sell ?? undefined, buy_sol: buy ?? undefined })
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [client])

  const rows = useMemo<Row[]>(() => {
    const range = aprRange(boards[PRODUCT[tab]] ?? null)
    let src: Row[] = (tab === 'call' ? CALLS : PUTS).map((m) =>
      m.asset === 'SOL' ? { ...m, live: true, maxApr: range?.max ?? m.maxApr, minApr: range?.min ?? m.minApr } : { ...m, live: false },
    )
    if (cls !== 'all') src = src.filter((m) => isRwa(m.asset) === (cls === 'rwa'))
    if (!sort) return src
    const val = (m: Row) => (sort.key === 'asset' ? m.asset.toLowerCase() : sort.key === 'chain' ? CHAINS[m.chainId].name : m[sort.key])
    return [...src].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir)
  }, [tab, sort, cls, boards])

  const toggleSort = (key: SortKey) => setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  // The cap bar is the desk's real aggregate exposure against its hard notional cap.
  const cap = health ? Math.min(100, (health.exposure.totalUsd / health.exposure.capTotalUsd) * 100) : 0
  const liveRange = aprRange(boards[PRODUCT[tab]] ?? null)

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
        <Tabs items={TABS} active={tab} onChange={setTab} />
        <div className="tbl-wrap">
          <div className="tbl" style={{ gridTemplateColumns: 'minmax(max-content, 1fr) minmax(max-content, 2fr) minmax(175px, max-content) minmax(125px, max-content) minmax(125px, max-content) max-content' }}>
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
            <div className="tbl-h end" role="columnheader">Type</div>
            <div className="tbl-h end" role="columnheader">
              <button type="button" onClick={() => toggleSort('maxApr')} style={{ display: 'flex', alignItems: 'center' }}><SortIcon />Max APR</button>
            </div>
            <div className="tbl-h end" role="columnheader">
              <button type="button" onClick={() => toggleSort('minApr')} style={{ display: 'flex', alignItems: 'center' }}><SortIcon />Min APR</button>
            </div>
            <div className="tbl-h end" role="columnheader" />

            {rows.map((m) => {
              const chain = CHAINS[m.chainId]
              const label = tab === 'call' ? `Earn on ${m.asset}` : `Earn on ${m.collateral}`
              const btnIcon = tab === 'call' ? iconFor(m.asset) : iconFor(m.collateral)
              const showApr = !m.live || liveRange !== null
              return (
                <ul className={`tbl-row ${m.live ? 'is-live' : 'is-soon'}`} key={`${m.asset}-${m.collateral}-${m.type}`}>
                  <li className="tbl-c sticky">
                    <div className="asset">
                      <img src={iconFor(m.asset)} alt={`The icon for ${m.asset}`} />
                      <div className="asset-id">
                        <span className="asset-tick">
                          <b>{m.asset}</b>
                          {m.live ? <span className="tag-live" title="Quoted live by the market maker on Solana devnet">LIVE</span> : <span className="tag-soon">SOON</span>}
                          {isRwa(m.asset) && <span className="tag-rwa">RWA</span>}
                        </span>
                        <small>{assetName(m.asset)}</small>
                      </div>
                    </div>
                  </li>
                  <li className="tbl-c"><div className="chain"><img src={chain.icon} alt={`The icon for ${chain.name}`} /><span>{chain.name}</span></div></li>
                  <li className="tbl-c end">{tab === 'call' ? 'Covered call' : 'Cash secured put'}</li>
                  <li className="tbl-c end"><span className={`apr ${m.live ? '' : 'apr-soon'}`}>{showApr ? `${m.maxApr.toFixed(2)}%` : '—'}</span></li>
                  <li className="tbl-c end"><span className={`apr ${m.live ? '' : 'apr-soon'}`}>{showApr ? `${m.minApr.toFixed(2)}%` : '—'}</span></li>
                  <li className="tbl-c end">
                    {m.live ? (
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
