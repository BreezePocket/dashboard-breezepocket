import { useEffect, useState } from 'react'
import { Logo } from '../components/Logo'

const BOOT = 'BREEZEPOCKET OS V.1.0.0 — SOLANA MAINNET\n~/vaults/ Initializing vault infrastructure...'

const FEATURES = [
  { n: '01', title: 'Segregated vault programs', body: 'Depositors add funds to a dedicated on-chain vault; the curator never receives or custodies them.' },
  { n: '02', title: 'RFQ liquidity', body: 'A single on-chain venue that aggregates signed quotes from integrated market makers, compared side by side.' },
  { n: '03', title: 'On-chain execution', body: 'Orders are priced through the RFQ network or agreed OTC and settle on Solana at the best quote.' },
  { n: '04', title: 'Full collateralization', body: 'Backing collateral is locked in the settlement program for the life of the trade. No rehypothecation.' },
  { n: '05', title: 'NAV accounting & epochs', body: 'Deposits and withdrawals queue during an epoch and execute at the struck NAV at each boundary.' },
  { n: '06', title: 'Permissioned or permissionless', body: 'Gate deposits by allowlist, or open the vault to any Solana wallet.' },
]

const STATS = [
  { label: 'NOTIONAL DEPLOYED', value: 218, fmt: (v: number) => `$${Math.round(v)}M+` },
  { label: 'PREMIUM PAID TO DEPOSITORS', value: 4, fmt: (v: number) => `$${Math.round(v)}M+` },
  { label: 'ASSETS LIVE', value: 8, fmt: (v: number) => `${Math.round(v)}+` },
  { label: 'WEEKLY CAPITAL RETENTION', value: 23, fmt: (v: number) => `${Math.round(v)}%+` },
  { label: 'MARKET MAKERS INTEGRATED', value: 5, fmt: (v: number) => `${Math.round(v)}+` },
  { label: 'SECURITY AUDITS', value: 2, fmt: (v: number) => `${Math.round(v)}` },
]

const FAQ = [
  ['What are BreezePocket Vaults?', 'BreezePocket Vaults are on-chain vault infrastructure for volatility income on Solana. They provide the vault programs, RFQ liquidity, on-chain execution, collateralization, NAV accounting, and settlement needed to launch options income products. The curator defines and runs the strategy; depositors earn volatility income without running the strategy themselves.'],
  ['What strategies and vault products can be built?', 'Covered calls and cash-secured puts are live today, with vertical spreads coming soon. These can be packaged into income vaults, accumulation vaults, ecosystem vaults, structured vaults, and institutional mandates, on effectively any Solana asset with pricing and liquidity, including SOL, liquid staking tokens, bridged BTC and ETH, and ecosystem tokens.'],
  ['How does a vault work?', 'Depositors add funds to a dedicated vault; the curator never receives or custodies them. The curator selects which options to write and at what strikes and expiries; orders are priced through the RFQ network or agreed OTC and execute on-chain. Vaults run in epochs: options trade freely within an epoch while deposits and withdrawals queue, then execute at the struck NAV at each epoch boundary so everyone enters and exits at fair value.'],
  ['How is collateral secured?', 'Positions are fully collateralized on-chain. Once a trade is filled, the backing collateral is locked in the settlement program for the life of the trade and never leaves it, with no rehypothecation, no shared portfolio risk, and no unsecured bilateral counterparty credit risk.'],
  ['What is the RFQ network?', 'A single on-chain venue that aggregates signed quotes from integrated market makers. A curator requests quotes across multiple strikes and expiries at once, compares them side by side, and executes the best on-chain. Short positions can be bought back early through the same flow.'],
  ['Can vaults be permissioned for institutions?', 'Yes. Permissioned vaults gate deposits by allowlist and can restrict quoting to approved market makers, ideal for institutional mandates with compliance requirements. Permissionless vaults are open to any Solana wallet on the same RFQ network and settlement.'],
  ['Which wallets are supported?', 'Any wallet that implements the Solana Wallet Standard, including Phantom, Solflare and Backpack. Connect from the button in the top right; BreezePocket never asks for your seed phrase.'],
  ['How do I get started?', 'Fill out the contact form above and our team will reach out to discuss your mandate and walk you through onboarding.'],
]

function useTypewriter(text: string, speed = 28) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const id = setInterval(() => setN((i) => (i >= text.length ? (clearInterval(id), i) : i + 1)), speed)
    return () => clearInterval(id)
  }, [text, speed])
  return text.slice(0, n)
}

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

function Stat({ label, value, fmt }: (typeof STATS)[number]) {
  const v = useCountUp(value)
  return (
    <div className="prem-stat">
      <small>{label}</small>
      <strong>{fmt(v)}</strong>
    </div>
  )
}

export default function Vaults() {
  const typed = useTypewriter(BOOT)
  const [open, setOpen] = useState<number | null>(0)
  const [sent, setSent] = useState(false)

  return (
    <section className="prem">
      <div className="prem-hero">
        <Logo size={44} light />
        <pre className="prem-term">{typed}<span className="cursor" /></pre>
      </div>

      <div className="grid-2">
        {FEATURES.map((f) => (
          <div key={f.n}>
            <div className="prem-label">~/{f.n}</div>
            <div className="prem-card">
              <div className="prem-term">BREEZEPOCKET OS V.1.0.0{'\n'}~/vaults/ Initialized</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="prem-label">~/stats</div>
        <div className="prem-stats">
          {STATS.map((s) => <Stat key={s.label} {...s} />)}
        </div>
      </div>

      <div>
        <div className="prem-label">~/contact</div>
        <form className="prem-form" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
          <p>Interested in setting up a custom option income vault on Solana? Let us know how we can help.</p>
          <div className="form-grid">
            <div className="field"><label htmlFor="name">FULL NAME</label><input id="name" required /></div>
            <div className="field"><label htmlFor="contact">EMAIL OR TELEGRAM</label><input id="contact" required /></div>
            <div className="field"><label htmlFor="org">ORGANIZATION</label><input id="org" /></div>
            <div className="field">
              <label htmlFor="alloc">ALLOCATION SIZE (USD)</label>
              <select id="alloc" defaultValue="">
                <option value="" disabled>Select allocation size</option>
                <option>$250K - $500K</option>
                <option>$500K - $1M</option>
                <option>$1M - $5M</option>
                <option>$5M - $10M</option>
                <option>$10M+</option>
              </select>
            </div>
            <div className="field wide">
              <span className="note">Minimum allocation size is $250K. Please contact us if you have questions about eligibility.</span>
            </div>
            <div className="field wide"><label htmlFor="assets">ASSETS OF INTEREST</label><input id="assets" placeholder="SOL, JitoSOL, WBTC…" /></div>
            <div className="field wide">
              <span className="note">We can support any Solana asset with pricing and liquidity.</span>
            </div>
            <div className="field wide"><label htmlFor="help">HOW CAN WE HELP YOU?</label><textarea id="help" /></div>
          </div>
          <button type="submit" className="btn prem-submit" disabled={sent}>{sent ? 'SUBMITTED' : 'SUBMIT'}</button>
        </form>
      </div>

      <div className="faq">
        <h2>Frequently Asked Questions</h2>
        {FAQ.map(([q, a], i) => (
          <div className="faq-item" key={q}>
            <button type="button" className="faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span>{q}</span><span>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <div className="faq-a">{a}</div>}
          </div>
        ))}
        <p className="faq-more">Have more questions? <a href="#">Contact us</a></p>
      </div>
    </section>
  )
}
