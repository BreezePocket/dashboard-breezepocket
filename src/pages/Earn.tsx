import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import Tabs from '../components/Tabs'
import { SortIcon, FilterIcon } from '../components/Icons'
import { CALLS, PUTS, CHAINS, CAP_SOLD, iconFor, marketHref, type Market } from '../data/markets'

type Tab = 'call' | 'put'
type SortKey = 'asset' | 'chain' | 'maxApr' | 'minApr'

const TABS = [
  { id: 'call' as Tab, label: 'covered calls' },
  { id: 'put' as Tab, label: 'cash secured puts' },
]

export default function Earn() {
  const [tab, setTab] = useState<Tab>('call')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)

  const rows = useMemo(() => {
    const src = tab === 'call' ? CALLS : PUTS
    if (!sort) return src
    const val = (m: Market) =>
      sort.key === 'asset' ? m.asset.toLowerCase() : sort.key === 'chain' ? CHAINS[m.chainId].name : m[sort.key]
    return [...src].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir)
  }, [tab, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  const cap = CAP_SOLD[tab]

  return (
    <section className="page">
      <PageTitle>Earn yield upfront</PageTitle>
      <Terminal title="~/assets">
        <div className="strip">
          <div className="strip-track">
            <div className="cap-fill" style={{ width: `${cap}%` }} />
            <span className="cap-label">{cap.toFixed(2)}% of cap sold</span>
          </div>
        </div>
        <Tabs items={TABS} active={tab} onChange={setTab} />
        <div className="tbl-wrap">
          <div
            className="tbl"
            style={{
              gridTemplateColumns:
                'minmax(max-content, 1fr) minmax(max-content, 2fr) minmax(175px, max-content) minmax(125px, max-content) minmax(125px, max-content) max-content',
            }}
          >
            <div className="tbl-h sticky" role="columnheader">
              <button type="button" onClick={() => toggleSort('asset')} style={{ display: 'flex', alignItems: 'center' }}>
                <SortIcon />Asset
              </button>
              <button type="button" className="filter-btn" aria-label="Filter assets"><FilterIcon /></button>
            </div>
            <div className="tbl-h" role="columnheader">
              <button type="button" onClick={() => toggleSort('chain')} style={{ display: 'flex', alignItems: 'center' }}>
                <SortIcon />Chain
              </button>
              <button type="button" className="filter-btn" aria-label="Filter chains"><FilterIcon /></button>
            </div>
            <div className="tbl-h end" role="columnheader">Type</div>
            <div className="tbl-h end" role="columnheader">
              <button type="button" onClick={() => toggleSort('maxApr')} style={{ display: 'flex', alignItems: 'center' }}>
                <SortIcon />Max APR
              </button>
            </div>
            <div className="tbl-h end" role="columnheader">
              <button type="button" onClick={() => toggleSort('minApr')} style={{ display: 'flex', alignItems: 'center' }}>
                <SortIcon />Min APR
              </button>
            </div>
            <div className="tbl-h end" role="columnheader" />

            {rows.map((m) => {
              const chain = CHAINS[m.chainId]
              const label = tab === 'call' ? `Earn on ${m.asset}` : `Earn on ${m.collateral}`
              const btnIcon = tab === 'call' ? iconFor(m.asset) : iconFor(m.collateral)
              return (
                <ul className="tbl-row" key={`${m.asset}-${m.collateral}-${m.type}`}>
                  <li className="tbl-c sticky">
                    <div className="asset">
                      <img src={iconFor(m.asset)} alt={`The icon for ${m.asset}`} />
                      <b>{m.asset}</b>
                    </div>
                  </li>
                  <li className="tbl-c">
                    <div className="chain">
                      <img src={chain.icon} alt={`The icon for ${m.chainId}`} />
                      <span>{chain.name}</span>
                    </div>
                  </li>
                  <li className="tbl-c end">{tab === 'call' ? 'Covered call' : 'Cash secured put'}</li>
                  <li className="tbl-c end"><span className="apr">{m.maxApr.toFixed(2)}%</span></li>
                  <li className="tbl-c end"><span className="apr">{m.minApr.toFixed(2)}%</span></li>
                  <li className="tbl-c end">
                    <Link className="btn-earn" to={marketHref(m)}>
                      <span className="ic"><img src={btnIcon} alt="" /></span>
                      {label}
                    </Link>
                  </li>
                </ul>
              )
            })}
          </div>
        </div>
      </Terminal>
    </section>
  )
}
