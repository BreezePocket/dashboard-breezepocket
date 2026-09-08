# BreezePocket

Options-income front end for Solana: sell covered calls or cash-secured puts on SOL, liquid staking tokens, bridged BTC/ETH and ecosystem tokens, and earn the premium upfront. Built with Vite, React, TypeScript, React Router and the Solana wallet adapter.

## Routes

| Path | What it shows |
| --- | --- |
| `/` | Earn: asset table with covered-call and cash-secured-put tabs, sortable columns, capacity bar |
| `/earn?asset=…&type=call\|put` | Strike picker, deposit amount, upfront-premium preview and payoff summary |
| `/vaults` | Vault infrastructure page with stats, contact form and FAQ |
| `/dashboard` | Income, chart and positions windows |
| `/points` | Points, referral and history windows |
| `/leaderboard` | Searchable overwriters / makers leaderboard |

## Wallet

The Connect button opens the Solana wallet modal. Any wallet that implements the Wallet Standard (Phantom, Solflare, Backpack, …) is detected automatically. Once connected the button shows the wallet address and the Earn detail page reads the wallet's SOL balance from the RPC.

The RPC defaults to the public `mainnet-beta` endpoint. Set your own in `.env`:

```
VITE_SOLANA_RPC=https://your-rpc-endpoint
```

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Placeholder data

Markets, APRs, spot prices, strikes, leaderboard rows and the stats on the Vaults page are static placeholders in `src/data/markets.ts` and the page files. Only the wallet connection and SOL balance are live on-chain reads; no transactions are sent.

## Structure

- `src/components` — background grid, nav, footer, logo, wallet button, terminal window, ribbon tabs, icons
- `src/hooks/useSolBalance.ts` — SOL balance of the connected wallet
- `src/pages` — one file per route
- `src/data/markets.ts` — markets, spot prices, strike and premium helpers
- `public/icons` — token, chain and social icons
