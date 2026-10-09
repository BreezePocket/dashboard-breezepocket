import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '../lib/wallet'
import { useConnection } from '../lib/connection'
import PageTitle from '../components/PageTitle'
import Panel from '../components/Panel'
import Tabs from '../components/Tabs'
import { SearchIcon } from '../components/Icons'
import { fetchAllPositions, notionalUsd, type PositionRow } from '../lib/program'

type Tab = 'overwriters' | 'makers'
const TABS = [
  { id: 'overwriters' as Tab, label: 'overwriters' },
  { id: 'makers' as Tab, label: 'makers' },
]
const REFRESH_MS = 60_000

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`
const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

/** Ranks wallets by the USD notional of every position they opened (overwriters) or took the other side of (makers). */
function rank(positions: PositionRow[], tab: Tab) {
  const by = new Map<string, { addr: string; volume: number; count: number }>()
  for (const p of positions) {
    const addr = (tab === 'overwriters' ? p.user : p.marketMaker).toBase58()
    const row = by.get(addr) ?? { addr, volume: 0, count: 0 }
    row.volume += notionalUsd(p)
    row.count += 1
    by.set(addr, row)
  }
  return [...by.values()].sort((a, b) => b.volume - a.volume).map((r, i) => ({ ...r, rank: i + 1 }))
}

export default function Leaderboard() {
  const { connection } = useConnection()
  const me = useWallet().publicKey?.toBase58()
  const [tab, setTab] = useState<Tab>('overwriters')
  const [q, setQ] = useState('')
  // null until the first read of the program's position accounts lands.
  const [positions, setPositions] = useState<PositionRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchAllPositions(connection)
        .then((rows) => { if (!cancelled) { setPositions(rows); setError(null) } })
        .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)) })
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [connection])

  const rows = useMemo(() => rank(positions ?? [], tab), [positions, tab])
  const shown = rows.filter((r) => r.addr.toLowerCase().includes(q.trim().toLowerCase()))
  const empty = positions === null
    ? error ? `Could not read positions from chain: ${error}` : 'Reading positions from chain…'
    : rows.length === 0 ? 'No positions opened yet'
    : shown.length === 0 ? `No users match "${q}"` : null

  return (
    <section className="page">
      <PageTitle>Leaderboard</PageTitle>
      <Panel title="Rankings">
        <label className="search-field">
          <SearchIcon />
          <input type="search" placeholder="Search for user" aria-label="Search for user" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Tabs items={TABS} active={tab} onChange={setTab} />
        <div className="tbl-wrap">
          <div className="tbl" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <div className="tbl-h">Rank</div>
            <div className="tbl-h">User</div>
            <div className="tbl-h end">Positions</div>
            <div className="tbl-h end">Volume</div>
            {shown.map((r) => (
              <ul className="tbl-row" key={r.addr}>
                <li className="tbl-c lb-rank">{r.rank}</li>
                <li className="tbl-c lb-addr" title={r.addr}>{short(r.addr)}{r.addr === me && ' (you)'}</li>
                <li className="tbl-c end">{r.count}</li>
                <li className="tbl-c end">{usd(r.volume)}</li>
              </ul>
            ))}
          </div>
          {empty && <div className="empty">{empty}</div>}
        </div>
      </Panel>
    </section>
  )
}
