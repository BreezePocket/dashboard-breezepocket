import { iconFor } from './markets'

export type EpochRow = {
  n: number
  status: 'OTM' | 'ITM'
  apr: string
  roi?: string
  roiHold?: string
  strike: string
  spot: string
  expiry: string
  tx: string
}

export type ThesisItem = { title: string; body: string; extra?: { title: string; body: string }[]; more?: boolean }

export type VaultDetailData = {
  id: string
  title: string
  asset: string
  assetName: string
  epochDays: number
  sentiment: string
  price: number
  description: string
  tvlUsd: string
  tvlUnits: string
  apr: string
  nextEpoch: string
  strike: string
  thesis: ThesisItem[]
  history: EpochRow[]
  mint: string
}

const HOW_IT_WORKS = (asset: string, label: string) => ({
  title: 'How It Works',
  body: `The vault runs Sell High on deposited ${asset}, writing European-style call options at a low-delta 103–107% OTM strike on a biweekly (14-day) epoch. Institutional market makers compete via auction to buy these options, and the winning premium is credited to depositors upfront.`,
  extra: [
    { title: 'AI-powered strike and size selection.', body: `While the epoch duration is fixed at a biweekly cadence, the strike and option size is designed to maximise the premium captured while minimizing the units of ${label} settled away above the strike.` },
  ],
  more: true,
})

const MODES = (asset: string) => ({
  title: 'Compounding and Income Modes',
  body: 'Depositors choose how their epoch premium is delivered. The choice is a per-user setting on the vault and can be toggled at any time.',
  extra: [
    { title: 'Compounding mode (default).', body: `Premium earned in USDC is automatically swapped to ${asset} as soon as received, and the resulting ${asset} is added to the depositor's principal during the next epoch. The position auto-compounds.` },
    { title: 'Income mode (optional toggle).', body: 'Premium earned in USDC is credited to a separate balance and is withdrawable at any time, including during an active options epoch. There are no locks, no queueing, and no waiting on epoch settlement to access the income stream.' },
    { title: '', body: 'Toggling between modes takes effect at the next epoch settlement. Switching from income to compounding does not retroactively sweep an existing income balance — already-accrued income remains withdrawable.' },
  ],
  more: true,
})

export const VAULT_DETAILS: Record<string, VaultDetailData> = {
  paxg: {
    id: 'paxg',
    title: 'PAXG Vol Income Vault',
    asset: 'PAXG',
    assetName: 'Paxos Gold',
    epochDays: 14,
    sentiment: 'Neutral - Bullish',
    price: 4434.22,
    description: 'An institutional-grade vault that runs a Biweekly automated Sell High strategy on PAXG (Tokenized Gold). Depositors earn option premium yield and choose how to receive it — Compounding mode reinvests premiums into more PAXG to grow your position over time, while Income mode pays premiums out as a steady yield stream.',
    tvlUsd: '$167.75K',
    tvlUnits: '37.8305 PAXG',
    apr: '8%',
    nextEpoch: '2026-09-17',
    strike: '4,663.53',
    mint: 'PAXGso1dGo1dVau1tBreezePocket1111111111111',
    thesis: [
      { title: 'Why Gold', body: "Gold presents a compelling macro setup. A strong rally through 2024–2026 has lifted implied volatility (GVZ in the high 20s and even into the low 30s), while the asset's role as a structural inflation hedge tends to favor measured price action over extended timeframes. This is precisely the environment where Sell High income shines: elevated premiums paired with steady, range-bound behavior or controlled upward growth." },
      { title: 'Income / Yield Generation', body: 'In 2026 year-to-date (until Jul 17) alone, backtests show a greater than 3% outperformance compared to simply buying and holding gold, which itself results in accumulating more.' },
      {
        title: 'For Whom?',
        body: 'The vault is deliberately not positioned as a product designed to "outperform buy-and-hold gold." Systematic premium income is a different return profile, suited to different audiences with different investment objectives. The three personas below illustrate who it is built for.',
        extra: [
          { title: 'Persona A — The gold believer growing wealth.', body: "An institution or individual who holds gold as a long-term store of wealth and wants to grow that wealth predictably. Gold has rallied significantly over the past two years. What if it mean-reverts and ranges for the next two? What if prices drift slightly lower over the coming year? Systematic premium income provides a cushion in flat-to-down and ranging markets, while the vault's conservative out-of-the-money strategy retains the large majority of any upside. That combination makes it a strong contender as a predictable wealth-growth product for someone who already intends to hold gold through the cycle." },
          { title: 'Persona B — The holder who wants income without timing the exit.', body: 'A user who already holds gold but is unsure when to take profit or sell to generate cash. Gold pays no dividend and produces no income on its own; realizing any return requires correctly timing a sale. By toggling on income mode, the USDC premium generated each epoch becomes withdrawable roughly every two weeks. The holder harnesses volatility to earn a recurring income stream — without ever having to time the sale of the underlying.' },
          { title: 'Persona C — The patient compounder.', body: "An investor who wants gold exposure with a wealth-compounding mindset rather than a trading one. They don't expect gold to make dramatic moves every two weeks, so they value the peace of mind that comes from a steady premium stream cushioning any downside, while the conservative out-of-the-money strategy preserves the large majority of gold's upside. They are happy holding the majority of their gold exposure while income is being generated on top, premiums smoothing the ride and compounding quietly over time, without the need to watch the market or act on short-term volatility." },
        ],
      },
      HOW_IT_WORKS('PAXG', 'gold'),
      MODES('PAXG'),
    ],
    history: [
      { n: 3, status: 'OTM', apr: '+8%', strike: '$4,663.53', spot: 'TBA', expiry: 'Sep 17', tx: '0xe023...5cf9' },
      { n: 2, status: 'OTM', apr: '+9.1%', roi: '-0.56%', roiHold: '-0.91%', strike: '$4,718.07', spot: '$4,431.32', expiry: 'Sep 3', tx: '0x250f...72d2' },
      { n: 1, status: 'OTM', apr: '+9.3%', roi: '+5.23%', roiHold: '+4.95%', strike: '$4,478.25', spot: '$4,475.97', expiry: 'Aug 20', tx: '0xe0d3...d929' },
    ],
  },
  tsla: {
    id: 'tsla',
    title: 'TSLAon Vol Income Vault',
    asset: 'TSLAon',
    assetName: 'Tesla (Tokenized Stock)',
    epochDays: 14,
    sentiment: 'Neutral - Bullish',
    price: 345.2,
    description: 'An institutional-grade vault that runs a Biweekly automated Sell High strategy on TSLAon (Tokenized Tesla stock). Tesla carries some of the richest implied volatility among large caps, so depositors earn elevated option premium yield — Compounding mode reinvests premiums into more TSLAon, while Income mode pays premiums out as a steady yield stream.',
    tvlUsd: '$92.38K',
    tvlUnits: '267.61 TSLAon',
    apr: '14%',
    nextEpoch: '2026-09-17',
    strike: '372.80',
    mint: 'TSLAonTokenizedStockBreezePocket11111111111',
    thesis: [
      { title: 'Why Tesla', body: "Tesla is one of the most actively traded and most volatile large-cap equities in the world. Implied volatility routinely sits in the 50–70% range, several times higher than the broad index, driven by delivery numbers, autonomy headlines, and macro rate sensitivity. That persistent volatility premium is exactly what a systematic Sell High strategy is paid to sell: rich upfront premium on a stock that spends long stretches ranging between catalysts." },
      { title: 'Income / Yield Generation', body: 'Backtests over 2024–2026 show that writing 105–108% OTM biweekly calls on TSLA harvested double-digit annualised premium while retaining the large majority of rally upside, with the premium cushion meaningfully reducing drawdowns in flat and down periods versus buy-and-hold.' },
      {
        title: 'For Whom?',
        body: 'The vault is not positioned to "beat Tesla stock." Systematic premium income is a different return profile, suited to holders with different objectives. The three personas below illustrate who it is built for.',
        extra: [
          { title: 'Persona A — The long-term Tesla holder.', body: 'An investor who intends to hold Tesla through the cycle and wants to grow that position predictably. Between catalysts the stock often ranges for weeks; systematic premium income turns that time into yield while the conservative out-of-the-money strategy retains most of any breakout.' },
          { title: 'Persona B — The holder who wants cash flow without selling.', body: 'A user who holds Tesla but does not want to time an exit. Tesla pays no dividend; by toggling on income mode, the USDC premium generated each epoch becomes withdrawable roughly every two weeks, turning volatility into a recurring income stream without selling the underlying.' },
          { title: 'Persona C — The patient compounder.', body: 'An investor who values a steady premium stream cushioning drawdowns, with premiums swapped back into TSLAon each epoch so the share count compounds quietly over time, without watching the tape or reacting to every headline.' },
        ],
      },
      HOW_IT_WORKS('TSLAon', 'TSLAon'),
      MODES('TSLAon'),
    ],
    history: [
      { n: 2, status: 'OTM', apr: '+14%', strike: '$372.80', spot: 'TBA', expiry: 'Sep 17', tx: '5Kd2...9xQm' },
      { n: 1, status: 'OTM', apr: '+15.4%', roi: '+3.12%', roiHold: '+2.58%', strike: '$361.50', spot: '$339.87', expiry: 'Sep 3', tx: '3nPa...Vt7c' },
    ],
  },
  hynix: {
    id: 'hynix',
    title: 'HYNIXon Vol Income Vault',
    asset: 'HYNIXon',
    assetName: 'SK Hynix (Tokenized Stock)',
    epochDays: 14,
    sentiment: 'Bullish',
    price: 182.4,
    description: 'A vault that runs a Biweekly automated Sell High strategy on HYNIXon (Tokenized SK Hynix stock), the leading supplier of high-bandwidth memory for AI accelerators. Depositors earn option premium yield on top of their exposure to the AI memory supercycle, with Compounding or Income payout modes.',
    tvlUsd: '$61.19K',
    tvlUnits: '335.47 HYNIXon',
    apr: '12%',
    nextEpoch: '2026-09-17',
    strike: '195.20',
    mint: 'HYNIXonTokenizedStockBreezePocket1111111111',
    thesis: [
      { title: 'Why SK Hynix', body: 'SK Hynix supplies the majority of the high-bandwidth memory (HBM) that powers AI accelerators, and the HBM supply cycle has driven a multi-year re-rating of the stock. Implied volatility stays elevated around earnings, capex announcements, and memory pricing data, while the structural demand story favors a steady grind higher over explosive moves. That mix of rich premium and controlled upside is where Sell High income does its best work.' },
      { title: 'Income / Yield Generation', body: 'Backtests over 2024–2026 show that writing 105–107% OTM biweekly calls on SK Hynix harvested low-double-digit annualised premium while keeping most of the trend upside, with the premium cushion reducing drawdowns during memory-pricing pullbacks versus buy-and-hold.' },
      {
        title: 'For Whom?',
        body: 'The vault is not designed to "outperform holding SK Hynix." Systematic premium income is a different return profile, suited to different objectives. The three personas below illustrate who it is built for.',
        extra: [
          { title: 'Persona A — The AI-memory believer.', body: 'An investor who wants to hold the HBM leader through the AI capex cycle and grow that position predictably. Premium income provides a cushion when memory pricing wobbles, while the conservative out-of-the-money strategy retains the large majority of the trend.' },
          { title: 'Persona B — The holder who wants income without timing the exit.', body: 'A user who holds SK Hynix exposure but does not want to time profit-taking. By toggling on income mode, the USDC premium generated each epoch becomes withdrawable roughly every two weeks, without ever selling the underlying.' },
          { title: 'Persona C — The patient compounder.', body: 'An investor with a compounding mindset who values a steady premium stream on top of a structural growth position, with premiums swapped back into HYNIXon each epoch so the position grows quietly over time.' },
        ],
      },
      HOW_IT_WORKS('HYNIXon', 'HYNIXon'),
      MODES('HYNIXon'),
    ],
    history: [
      { n: 2, status: 'OTM', apr: '+12%', strike: '$195.20', spot: 'TBA', expiry: 'Sep 17', tx: '8Rk4...2mLp' },
      { n: 1, status: 'OTM', apr: '+12.8%', roi: '+4.41%', roiHold: '+4.02%', strike: '$188.10', spot: '$179.65', expiry: 'Sep 3', tx: 'Bq7w...Hc3e' },
    ],
  },
}

export const vaultIcon = (v: VaultDetailData) => iconFor(v.asset)
