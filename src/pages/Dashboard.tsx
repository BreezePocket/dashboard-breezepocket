import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { shortAddr } from '../components/WalletButton'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import Tabs from '../components/Tabs'

type Tab = 'positions' | 'total' | 'history'
const TABS = [
  { id: 'positions' as Tab, label: 'positions' },
  { id: 'total' as Tab, label: 'total' },
  { id: 'history' as Tab, label: 'history' },
]
const COLS = ['Asset', 'Chain', 'Type', 'Maturity', 'Size', 'Notional', 'Strike Ntl.', 'APR', 'Income', 'Current Price', 'Target', 'Outcome']

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('positions')
  const { publicKey } = useWallet()
  const who = publicKey ? `${shortAddr(publicKey.toBase58())}: no positions yet` : 'wallet not connected'
  return (
    <section className="page">
      <PageTitle>Dashboard</PageTitle>
      <div className="grid-2">
        <Terminal title="~/income">
          <div className="term-empty">~/income: {who}</div>
        </Terminal>
        <Terminal title="~/chart">
          <div className="term-empty">~/dashboard/chart: {who}</div>
        </Terminal>
      </div>
      <Terminal title="~/positions">
        <Tabs items={TABS} active={tab} onChange={setTab} />
        <div className="tbl-wrap">
          <div className="tbl" style={{ gridTemplateColumns: `repeat(${COLS.length}, minmax(max-content, 1fr))` }}>
            {COLS.map((c, i) => (
              <div key={c} className={`tbl-h ${i === 0 ? 'sticky' : 'end'} ${c === 'Notional' ? 'bold' : ''}`} style={{ paddingLeft: 16, paddingRight: 16 }}>
                {c}
              </div>
            ))}
          </div>
          <div className="term-empty">~/dashboard/{tab}: {who}</div>
        </div>
      </Terminal>
    </section>
  )
}
