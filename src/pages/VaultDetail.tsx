import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { VAULT_DETAILS, vaultIcon } from '../data/vaults'
import { iconFor } from '../data/markets'

const fmtUsd = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
)
const ExtIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17L17 7M9 7h8v8" />
  </svg>
)
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" />
  </svg>
)
const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 2.5 20h19L12 3z" /><path d="M12 10v4M12 17h.01" />
  </svg>
)

export default function VaultDetail() {
  const { id = '' } = useParams()
  const v = VAULT_DETAILS[id]
  const { connected, publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [more, setMore] = useState(false)
  const [copied, setCopied] = useState(false)
  const thesisRef = useRef<HTMLDivElement>(null)
  const feesRef = useRef<HTMLDivElement>(null)
  const histRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<'thesis' | 'fees' | 'history'>('thesis')

  const balance = 0 // SPL token balances are not read in this build
  const qty = useMemo(() => Math.max(0, parseFloat(amount) || 0), [amount])

  if (!v) {
    return (
      <section className="vaults">
        <nav className="vd-crumb"><Link to="/vaults">Vaults</Link><span>›</span><span>Unknown vault</span></nav>
        <p className="vd-muted">This vault does not exist. <Link to="/vaults" className="vd-link">Back to vaults</Link></p>
      </section>
    )
  }

  const go = (t: typeof tab, ref: React.RefObject<HTMLDivElement | null>) => {
    setTab(t)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const copy = () => {
    navigator.clipboard?.writeText(v.mint).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  const setPct = (p: number) => setAmount(balance ? String(+(balance * p).toFixed(6)) : '0')
  const step = (d: number) => setAmount((a) => String(Math.max(0, +((parseFloat(a) || 0) + d).toFixed(6))))
  const visibleThesis = more ? v.thesis : v.thesis.slice(0, 3)

  return (
    <section className="vaults vd">
      <nav className="vd-crumb"><Link to="/vaults">Vaults</Link><span>›</span><span>{v.title}</span></nav>

      <div className="vd-grid">
        <div className="vd-main">
          <header className="vd-head">
            <h1>
              <img src={vaultIcon(v)} alt="" />
              <span>{v.title}</span>
              <button type="button" className="vd-copy" onClick={copy} aria-label="Copy Vault Address" title={copied ? 'Copied' : 'Copy Vault Address'}><CopyIcon /></button>
            </h1>
            <div className="vd-sub">
              <span>{v.assetName} • {v.epochDays} Days</span>
              <span className="vpill"><img src="/icons/sentiment.svg" alt="" aria-hidden="true" />{v.sentiment}</span>
            </div>
            <div className="vd-price">Current Price @ {fmtUsd(v.price)}</div>
            <p className="vd-desc">{v.description}</p>
            <button type="button" className="vd-how" onClick={() => go('thesis', thesisRef)}>How This Vault Works</button>
          </header>

          <div className="vd-stats">
            <div className="vd-stat"><small>Vault TVL</small><strong>{v.tvlUsd}</strong><span>{v.tvlUnits}</span></div>
            <div className="vd-stat"><small>Current APR</small><strong className="green">{v.apr}</strong><span>from call premiums</span></div>
            <div className="vd-stat"><small>Epoch Period</small><strong>{v.epochDays} Days</strong><span>next epoch @ {v.nextEpoch}</span></div>
            <div className="vd-stat"><small>Strike Price</small><strong className="blue">{v.strike}</strong><span>current epoch</span></div>
          </div>

          <div className="vd-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'thesis'} className={tab === 'thesis' ? 'on' : ''} onClick={() => go('thesis', thesisRef)}>Thesis</button>
            <button type="button" role="tab" aria-selected={tab === 'fees'} className={tab === 'fees' ? 'on' : ''} onClick={() => go('fees', feesRef)}>Fees</button>
            <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => go('history', histRef)}>Vault Epoch History</button>
          </div>

          <div className="vd-card" ref={thesisRef}>
            <h2>Thesis</h2>
            <ol className="vd-thesis">
              {visibleThesis.map((t, i) => (
                <li key={t.title}>
                  <span className="vd-num">{i + 1}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <p>{t.body}</p>
                    {t.extra && (more || !t.more) && t.extra.map((e, j) => (
                      <p key={j} className="vd-extra">{e.title && <b>{e.title} </b>}{e.body}</p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            <button type="button" className="vd-more" onClick={() => setMore((m) => !m)}>{more ? 'Show Less ⌃' : 'Read More ⌄'}</button>
          </div>

          <div className="vd-card" ref={feesRef}>
            <h2>Fees</h2>
            <div className="vd-fee"><span className="vd-fee-ic"><InfoIcon /></span><div><strong>Zero</strong><span>Deposit and Withdrawal Fee</span></div></div>
            <div className="vd-fee"><span className="vd-fee-ic"><InfoIcon /></span><div><strong>0.5%</strong><span>Annualised Protocol Fee on TVL</span><small>Pro-rated, billed ~0.019% each epoch</small></div></div>
          </div>

          <div className="vd-card" ref={histRef}>
            <h2>Vault Epoch History</h2>
            <div className="vd-table-wrap">
              <table className="vd-table">
                <thead>
                  <tr><th>Epoch</th><th>APR</th><th>ROI vs Hold</th><th>Strike</th><th>Spot</th><th>Settlement</th><th>Expiry</th><th>Transaction</th></tr>
                </thead>
                <tbody>
                  {v.history.map((r, i) => (
                    <tr key={r.n}>
                      <td><span className={`vd-dot ${i === 0 ? 'live' : ''}`} />#{r.n} <span className="vd-otm">{r.status}</span></td>
                      <td className="green">{r.apr}</td>
                      <td>{r.roi ? <><span className={r.roi.startsWith('-') ? 'red' : 'green'}>{r.roi}</span><small>vs {r.roiHold}</small></> : <b>TBA</b>}</td>
                      <td>{r.strike}</td>
                      <td>{r.spot}</td>
                      <td>{r.spot === 'TBA' ? 'TBA' : 'Settled'}</td>
                      <td>{r.expiry}</td>
                      <td><a href="#" className="vd-link">{r.tx} <ExtIcon /></a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="vd-side">
          <div className="vd-panel">
            <div className="vd-seg">
              <button type="button" className={mode === 'deposit' ? 'on' : ''} onClick={() => setMode('deposit')}>Deposit</button>
              <button type="button" className={mode === 'withdraw' ? 'on' : ''} onClick={() => setMode('withdraw')}>Withdraw</button>
            </div>
            <div className="vd-amt-head">
              <span>{mode === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'}</span>
              <span>Balance: {balance} {v.asset}</span>
            </div>
            <div className="vd-amt">
              <button type="button" onClick={() => step(-1)} aria-label="Decrease">−</button>
              <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
              <span className="vd-token"><span>{v.asset}</span><img src={iconFor(v.asset)} alt="" /></span>
              <button type="button" onClick={() => step(1)} aria-label="Increase">+</button>
            </div>
            <div className="vd-pcts">
              {[0.25, 0.5, 0.75].map((p) => <button type="button" key={p} onClick={() => setPct(p)}>{p * 100}%</button>)}
              <button type="button" onClick={() => setPct(1)}>MAX</button>
            </div>
            <dl className="vd-rows">
              <div><dt>Network</dt><dd><img src="/icons/solana.svg" alt="" />Solana</dd></div>
              <div><dt>{mode === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'}</dt><dd>{qty ? qty.toLocaleString('en-US', { maximumFractionDigits: 6 }) : 0} {v.asset}</dd></div>
            </dl>
            {connected ? (
              <button type="button" className="vd-cta" disabled={qty <= 0 || qty > balance}>
                {qty <= 0 ? `Enter ${mode} amount` : qty > balance ? 'Insufficient balance' : mode === 'deposit' ? 'Deposit' : 'Request Withdrawal'}
              </button>
            ) : (
              <button type="button" className="vd-cta" onClick={() => setVisible(true)}>Connect Wallet</button>
            )}
            {connected && publicKey && <div className="vd-wallet">Connected: {short(publicKey.toBase58())}</div>}
            <div className="vd-warn">
              <WarnIcon />
              <p>Deposits are deployed at the next epoch roll. Withdrawal requests are queued and settled at epoch end; queued funds do not accrue yield during this period and may be cancelled before the next epoch.</p>
            </div>
          </div>

          <div className="vd-panel vd-details">
            <h3>Details</h3>
            <dl className="vd-rows">
              <div><dt>Collateral</dt><dd>Fully Collateralized {v.asset}</dd></div>
              <div><dt>Token Address</dt><dd><a href="#" className="vd-link">{short(v.mint)} <ExtIcon /></a></dd></div>
              <div><dt>Security Audits</dt><dd><a href="#" className="vd-link">Reports <ExtIcon /></a></dd></div>
              <div><dt>Documentation</dt><dd><a href="#" className="vd-link">Litepaper <ExtIcon /></a></dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  )
}
