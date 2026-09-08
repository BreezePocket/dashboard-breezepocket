import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import { Mark } from '../components/Logo'
import { useWallet } from '@solana/wallet-adapter-react'
import { shortAddr } from '../components/WalletButton'

const COLS = ['Period', 'Rank', 'Tier', 'Total points', 'Activity points', 'Referral points']

export default function Points() {
  const { publicKey } = useWallet()
  const who = publicKey ? `${shortAddr(publicKey.toBase58())}: no history yet` : 'wallet not connected'
  return (
    <section className="page">
      <PageTitle>Points</PageTitle>
      <div className="grid-12">
        <Terminal title="~/points" className="span-6">
          <div className="pt-body">
            <div className="pt-main">
              <span className="pt-big">0.00</span>
              <button type="button" className="btn" disabled style={{ width: 288 }}>Upload and save image</button>
            </div>
            <div className="pt-foot">
              <div className="pt-stat"><span>-</span><small>Leaderboard rank</small></div>
              <span className="pt-badge" aria-hidden="true"><Mark id="bp-grad-badge" /></span>
            </div>
          </div>
        </Terminal>
        <Terminal title="~/points/referral" className="span-6">
          <div className="pt-body">
            <div className="pt-main">
              <span>Open one position to unlock your referral code</span>
              <div className="pt-row">
                <button type="button" className="btn" disabled style={{ width: 192 }}>Copy</button>
                <button type="button" className="btn" disabled style={{ width: 192 }}>Share on X</button>
              </div>
            </div>
            <div className="pt-foot">
              <div className="pt-stat"><span>0</span><small>Users referred</small></div>
            </div>
          </div>
        </Terminal>
        <Terminal title="~/points/history" className="span-12">
          <div className="pt-learn">
            <a className="link-u" href="#">Learn more about BreezePocket Points.</a>
          </div>
          <div className="tbl-wrap">
            <div className="tbl" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {COLS.map((c, i) => (
                <div key={c} className={`tbl-h ${i === 0 ? 'bold' : 'end'}`}>{c}</div>
              ))}
            </div>
            <div className="term-empty">~/points/history: {who}</div>
          </div>
        </Terminal>
      </div>
    </section>
  )
}
