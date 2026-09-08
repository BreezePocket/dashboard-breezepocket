import { useMemo, useState } from 'react'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import Tabs from '../components/Tabs'
import { SearchIcon } from '../components/Icons'

type Tab = 'overwriters' | 'makers'
const TABS = [
  { id: 'overwriters' as Tab, label: 'overwriters' },
  { id: 'makers' as Tab, label: 'makers' },
]

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/** Deterministic placeholder rows (base58 Solana-style addresses) so the table has something to show without a backend. */
function mockRows(seed: number, n: number) {
  let s = seed
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
  const ch = () => B58[Math.floor(rnd() * B58.length)]
  return Array.from({ length: n }, (_, i) => {
    const addr = Array.from({ length: 44 }, ch).join('')
    return { rank: i + 1, addr, volume: Math.round((n - i) * 180_000 * (0.6 + rnd() * 0.8)) }
  }).sort((a, b) => b.volume - a.volume).map((r, i) => ({ ...r, rank: i + 1 }))
}

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('overwriters')
  const [q, setQ] = useState('')
  const rows = useMemo(() => mockRows(tab === 'overwriters' ? 7 : 11, 20), [tab])
  const shown = rows.filter((r) => r.addr.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <section className="page">
      <PageTitle>Leaderboard</PageTitle>
      <Terminal title={`~/leaderboard/${tab}`}>
        <div className="strip">
          <div className="strip-track search">
            <SearchIcon />
            <input placeholder="Search for user" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <Tabs items={TABS} active={tab} onChange={setTab} />
        <div className="tbl-wrap">
          <div className="tbl" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="tbl-h bold">Rank</div>
            <div className="tbl-h">User</div>
            <div className="tbl-h end">Volume</div>
            {shown.map((r) => (
              <ul className="tbl-row" key={r.addr}>
                <li className="tbl-c lb-rank">{r.rank}</li>
                <li className="tbl-c lb-addr" title={r.addr}>{short(r.addr)}</li>
                <li className="tbl-c end">${r.volume.toLocaleString('en-US')}</li>
              </ul>
            ))}
          </div>
          {shown.length === 0 && <div className="term-empty">~/leaderboard/{tab}: no users match "{q}"</div>}
        </div>
      </Terminal>
    </section>
  )
}
