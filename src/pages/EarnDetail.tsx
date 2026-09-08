import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSolBalance } from '../hooks/useSolBalance'
import PageTitle from '../components/PageTitle'
import Terminal from '../components/Terminal'
import { Chevron } from '../components/Icons'
import {
  CHAINS, SOLANA, iconFor, underlyingOf, strikesFor, expiryLabel, expiryLong, daysToExpiry, fmtPrice, fmtNum,
  type OptionType,
} from '../data/markets'

export default function EarnDetail() {
  const [params] = useSearchParams()
  const asset = params.get('asset') || 'SOL'
  const collateral = params.get('collateral') || asset
  const strikeCcy = params.get('strike') || 'USDC'
  const type = (params.get('type') === 'put' ? 'put' : 'call') as OptionType

  const { name: under, spot } = underlyingOf(asset)
  const strikes = useMemo(() => strikesFor(asset, type), [asset, type])
  const [sel, setSel] = useState<number | null>(null)
  const [amount, setAmount] = useState<string>(type === 'call' ? '50' : '5000')
  const { connected } = useWallet()
  const solBalance = useSolBalance()
  // Only native SOL balances are read from chain; SPL token balances are not fetched in this build.
  const balance = collateral === 'SOL' && solBalance !== null ? solBalance : 0

  const days = daysToExpiry()
  const qty = Math.max(0, parseFloat(amount) || 0)
  const chosen = sel === null ? null : strikes[sel]
  const typeLabel = type === 'call' ? 'Covered call' : 'Cash secured put'
  const expiry = expiryLabel()

  // Premium earned upfront for the chosen strike, in the strike currency.
  const notional = type === 'call' ? qty * spot : qty
  const premium = chosen ? (notional * (chosen.apr / 100) * days) / 365 : 0
  const units = type === 'call' ? qty : chosen ? qty / chosen.price : 0

  const step = (d: number) => setAmount((a) => String(Math.max(0, (parseFloat(a) || 0) + d)))

  return (
    <section className="page">
      <PageTitle>Earn yield upfront</PageTitle>
      <Terminal title={`~/earn/${asset}/${collateral}/${expiry}`}>
        <div className="ed-head">
          <div className="ed-head-group">
            <button type="button" className="chip">
              <img src={iconFor(asset)} alt="" />
              <span>{asset}</span>
              <Chevron />
            </button>
            <button type="button" className="chip"><span>{typeLabel}</span><Chevron /></button>
            <button type="button" className="chip"><span>{expiry}</span><Chevron /></button>
          </div>
          <div className="ed-head-group">
            <span className="ed-price">{fmtPrice(spot)}</span>
            <div className="gauge" title="Share of this market's capacity already sold">
              <div className="gauge-arc" style={{ ['--deg' as string]: '0deg' }} />
              <small>0% of cap</small>
            </div>
          </div>
        </div>

        <div className="ed-body">
          <div className="ed-prompt">
            <span>
              Choose the price at which you are happy to {type === 'call' ? 'sell' : 'buy'} {asset} on {expiryLong()} (in {days} days)
            </span>
          </div>

          <ul className="strikes">
            {strikes.map((s, i) => (
              <li key={s.price} className={`strike ${sel === i ? 'is-selected' : ''}`} data-tone={s.tone}>
                <small className="strike-tag"><span>APR</span><span>{s.apr.toFixed(2)}%</span></small>
                <button type="button" className="strike-btn" onClick={() => setSel(i)}>
                  <strong>{fmtPrice(s.price)}</strong>
                </button>
              </li>
            ))}
          </ul>

          <div className="amount">
            <div className="amount-left">
              <small className="amount-max" onClick={() => setAmount(String(balance))}>MAX</small>
              <div className="amount-steps">
                <button type="button" onClick={() => step(1)} aria-label="Increase">+</button>
                <button type="button" onClick={() => step(-1)} aria-label="Decrease">-</button>
              </div>
              <input
                id="quantity"
                name="quantity"
                inputMode="decimal"
                autoComplete="off"
                placeholder="amount to deposit"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
            </div>
            <div className="amount-right">
              <div>
                <label htmlFor="quantity">{collateral}</label>
                <small>{connected ? fmtNum(balance, collateral === 'SOL' ? 4 : 2) : '0'}</small>
              </div>
              <div className="coin">
                <img src={iconFor(collateral)} alt="" />
                <img src={CHAINS[SOLANA].icon} alt="" />
              </div>
            </div>
          </div>
          <div className="amount-foot">
            <small className="warn" style={{ opacity: connected && qty > balance ? 1 : 0 }}>INSUFFICIENT BALANCE</small>
          </div>

          <div className="payoff">
            <div className="payoff-bar"><span>Now</span></div>
            <div className="payoff-now">
              <div className="payoff-apr">
                <span><span className="big">{chosen ? `${chosen.apr.toFixed(2)}%` : '--'}</span> APR</span>
                <span>{chosen ? `${fmtNum(premium)} ${strikeCcy} upfront` : 'Select a price to see your premium'}</span>
              </div>
              <ul className="payoff-legend" aria-hidden="true">
                {strikes.map((s, i) => <li key={s.price} className={sel !== null && i <= sel ? 'on' : ''} />)}
              </ul>
            </div>
            <div className="payoff-bar"><span>On {expiry}</span></div>
            <div className="payoff-out">
              {type === 'call' ? (
                <>
                  <div>
                    <small>If {under} <b>BELOW</b> {chosen ? fmtPrice(chosen.price) : '--'}</small>
                    <strong><img src={iconFor(asset)} alt="" />Get {fmtNum(qty, 0)} {asset} back</strong>
                  </div>
                  <div>
                    <small>If {under} <b>ABOVE</b> {chosen ? fmtPrice(chosen.price) : '--'}</small>
                    <strong><img src={iconFor(strikeCcy)} alt="" />Receive {chosen ? fmtNum(qty * chosen.price) : '--'} {strikeCcy}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <small>If {under} <b>ABOVE</b> {chosen ? fmtPrice(chosen.price) : '--'}</small>
                    <strong><img src={iconFor(collateral)} alt="" />Get {fmtNum(qty)} {collateral} back</strong>
                  </div>
                  <div>
                    <small>If {under} <b>BELOW</b> {chosen ? fmtPrice(chosen.price) : '--'}</small>
                    <strong><img src={iconFor(asset)} alt="" />Receive {chosen ? fmtNum(units, 4) : '--'} {asset}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="ed-cta">
            <button type="button" className="btn btn-primary" disabled={!chosen || qty <= 0 || !connected || qty > balance}>
              {!chosen ? 'Select price' : !connected ? 'Connect wallet to continue' : qty > balance ? 'Insufficient balance' : 'Earn upfront premium now'}
            </button>
          </div>
        </div>
      </Terminal>
    </section>
  )
}
