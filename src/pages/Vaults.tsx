import { Link } from 'react-router-dom'
import { iconFor } from '../data/markets'

type Vault = {
  id: string
  title: string
  subtitle: string
  sentiment: string
  apr: string
  icon: string
  body: string
  bullets?: string[]
  href?: string
}

const earn = (asset: string, type: 'call' | 'put' = 'call') =>
  `/earn?asset=${asset}&collateral=${type === 'call' ? asset : 'USDC'}&strike=USDC&type=${type}`

const VAULTS: Vault[] = [
  {
    id: 'paxg',
    title: 'PAXG Vol Income Vault',
    subtitle: 'Paxos Gold',
    sentiment: 'Neutral - Bullish',
    apr: '8%',
    icon: iconFor('PAXG'),
    body: 'An institutional-grade vault that runs a Biweekly automated covered call strategy on PAXG (Tokenized Gold). Depositors earn option premium yield and choose how to receive it — Compounding mode reinvests premiums into more PAXG to grow your position over time, while Income mode pays premiums out as a steady yield stream.',
    bullets: [
      'Accumulate for the medium-long term as part of portfolio diversification.',
      'Generate “income” from Gold.',
      'A bet on systemic central bank buying.',
    ],
    href: earn('PAXG'),
  },
  {
    id: 'tsla',
    title: 'TSLAon Vol Income Vault',
    subtitle: 'Tesla (Tokenized Stock)',
    sentiment: 'Neutral - Bullish',
    apr: '14%',
    icon: iconFor('TSLAon'),
    body: 'An institutional-grade vault that runs a Biweekly automated covered call strategy on TSLAon (Tokenized Tesla stock). Tesla carries some of the richest implied volatility among large caps, so depositors earn elevated option premium yield — Compounding mode reinvests premiums into more TSLAon, while Income mode pays premiums out as a steady yield stream.',
    bullets: [
      'Monetize Tesla’s elevated volatility without selling your position.',
      'Generate income from tokenized equity exposure onchain.',
      'A bet on continued retail and institutional demand for TSLA.',
    ],
    href: earn('TSLAon'),
  },
  {
    id: 'hynix',
    title: 'HYNIXon Vol Income Vault',
    subtitle: 'SK Hynix (Tokenized Stock)',
    sentiment: 'Bullish',
    apr: '12%',
    icon: iconFor('HYNIXon'),
    body: 'A vault that runs a Biweekly automated covered call strategy on HYNIXon (Tokenized SK Hynix stock), the leading supplier of high-bandwidth memory for AI accelerators. Depositors earn option premium yield on top of their exposure to the AI memory supercycle, with Compounding or Income payout modes.',
    bullets: [
      'Earn premium on the world’s leading HBM supplier.',
      'Income from the AI memory supercycle, settled onchain.',
      'A bet on sustained AI data-center capex.',
    ],
    href: earn('HYNIXon'),
  },
  {
    id: 'nvda',
    title: 'NVDAon Vol Income Vault',
    subtitle: 'NVIDIA (Tokenized Stock)',
    sentiment: 'Bullish',
    apr: 'TBA',
    icon: iconFor('NVDAon'),
    body: 'A Biweekly automated covered call strategy on NVDAon (Tokenized NVIDIA stock). Strikes are set out-of-the-money to keep most of the upside of the leading AI compute franchise while harvesting its option premium as yield.',
  },
  {
    id: 'spy',
    title: 'SPYon Principal Protected Vault',
    subtitle: 'S&P 500 (Tokenized ETF)',
    sentiment: 'Bullish Skew',
    apr: 'TBA',
    icon: iconFor('SPYon'),
    body: 'An automated capital protection strategy backed by fixed-income assets and long call options on SPYon. Depositors secure 100% principal protection against market drops while capturing upward moves of the S&P 500 Index when the options expire in-the-money.',
  },
  {
    id: 'xag',
    title: 'XAGon Vol Income Vault',
    subtitle: 'Tokenized Silver',
    sentiment: 'Neutral - Bullish',
    apr: 'TBA',
    icon: iconFor('XAGon'),
    body: 'A Biweekly automated covered call strategy on XAGon (Tokenized Silver). Silver’s higher volatility relative to gold means richer premiums for depositors who are cautiously bullish on industrial and monetary demand for the metal.',
  },
  {
    id: 'tbill',
    title: 'T-Bill Yield Vault',
    subtitle: 'US Treasury Bills (Tokenized)',
    sentiment: 'Neutral',
    apr: 'TBA',
    icon: iconFor('TBILL'),
    body: 'A fixed-income base layer built on tokenized short-dated US Treasury bills. The vault rolls maturities automatically and pays the risk-free rate as a steady yield stream, and serves as the principal-protection leg for the structured vaults above.',
  },
]

function VaultCard({ v }: { v: Vault }) {
  return (
    <article className="vcard">
      <div className="vcard-head">
        <div className="vcard-id">
          <img src={v.icon} alt={v.subtitle} />
          <div>
            <p className="vcard-title">{v.title}</p>
            <div className="vcard-sub">
              <span>{v.subtitle}</span>
              <span className="vpill"><img src="/icons/sentiment.svg" alt="" aria-hidden="true" />{v.sentiment}</span>
            </div>
          </div>
        </div>
        <div className="vcard-apr">
          <strong>{v.apr}</strong>
          <span>Current APR</span>
        </div>
      </div>
      <p className="vcard-body">{v.body}</p>
      {v.bullets && (
        <ul className="vcard-bullets">
          {v.bullets.map((b) => <li key={b}><span aria-hidden="true">•</span><span>{b}</span></li>)}
        </ul>
      )}
      <div className="vcard-foot">
        {v.href ? <Link className="vstart" to={v.href}>Start</Link> : <span className="vsoon">Coming Soon</span>}
      </div>
    </article>
  )
}

export default function Vaults() {
  const featured = VAULTS[0]
  return (
    <section className="vaults">
      <Link to={featured.href!} className="vbanner" aria-label="Open featured vault">
        <div className="vbanner-top">
          <span className="vbanner-live"><b>Live Now</b>{featured.title}</span>
          <span className="vbanner-chip">Bi-weekly <span>Epoch</span></span>
        </div>
        <div className="vbanner-body">
          <div>
            <div className="vbanner-kicker">Deposit anytime to join the next epoch</div>
            <h2>Earn yield on <img src={featured.icon} alt="" /> PAXG</h2>
            <p className="vbanner-lead">
              Cautiously bullish on gold? Let option premium cushion your downside with low delta, out-of-the-money covered calls – and keep most of the upside.
            </p>
            <span className="vbanner-cta">Deposit Now <span aria-hidden="true">→</span></span>
          </div>
          <div className="vbanner-apr">
            <strong>{featured.apr}<sup>*</sup></strong>
            <span>APR from Premiums</span>
          </div>
        </div>
        <div className="vbanner-note">*APR for the current epoch. Past performance is not indicative of future returns.</div>
      </Link>

      <div className="vsection">
        <h1>Thesis Vaults</h1>
        <p>Buy the thesis. Own the outcome.</p>
        <p>
          Vaults blending crypto, RWAs, onchain options, and binary event positions into single strategies — defined payouts, structured income, or hedged exposure, priced by institutional market makers.
        </p>
      </div>

      <div className="vgrid">
        {VAULTS.map((v) => <VaultCard key={v.id} v={v} />)}
      </div>
    </section>
  )
}
