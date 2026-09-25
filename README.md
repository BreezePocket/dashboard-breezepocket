# BreezePocket

Options-income front end for Solana: sell covered calls or cash-secured puts on SOL, liquid staking tokens, bridged BTC/ETH and ecosystem tokens, and earn the premium upfront. Built with Vite, React, TypeScript, React Router and the Solana wallet adapter.

## Routes

| Path | What it shows |
| --- | --- |
| `/` | Earn: asset table with covered-call and cash-secured-put tabs, sortable columns, capacity bar |
| `/earn?asset=…&type=call\|put` | Strike picker, deposit amount, upfront-premium preview and payoff summary |
| `/vaults` | Thesis Vaults: featured PAXG banner plus vault cards |
| `/vault/:id` | Vault detail (paxg, tsla, hynix): stats, thesis, fees, epoch history, deposit/withdraw panel |
| `/dashboard` | Income, chart and positions windows |
| `/points` | Points, referral and history windows |
| `/leaderboard` | Searchable overwriters / makers leaderboard |

## On-chain integration (Solana devnet)

The app is wired to the breezepocket Anchor program and its house market maker:

| | |
| --- | --- |
| Program | `BeytdpJYSGP1oFRxEiBLkSRGuW6HW3Pk9dqSZCuSteQ9` on devnet (source: `../core`) |
| GlobalConfig | `BejjQ3MwvvFwaP3FxyDjj7Cu4gBMrH5Txr5xuCR32THp` |
| Test USDC mint | `GxSfF7CfT3C2Sr7RYFwXoRHmhFeH4DpUVQCDNiktxEFD` |
| Market maker | `../MM-system/breezepocket-mm`, REST on port 8787 |

Live markets are **SOL covered calls** (Sell SOL) and **SOL cash-secured puts** (Buy SOL); every other row on the Earn page is a roadmap placeholder marked SOON.

**Data the frontend reads**

- Expiries, strikes and yields come from the desk (`GET /expiries`, `GET /board`), priced off the Deribit SOL option chain. The Earn list shows the desk's live max/min APR and its real exposure against the notional cap.
- Positions, settlement prices and balances are read from devnet via `getProgramAccounts` and the Anchor IDL in `src/idl/`.

**Opening a position** (`src/pages/EarnDetail.tsx`, `src/lib/program.ts`, `src/lib/mm.ts`)

1. The page requests a binding quote (`POST /rfq`) for the connected wallet, strike, expiry and amount; quotes expire after 30s and are refreshed automatically.
2. It builds the `open_position` transaction with the market maker as fee payer, the user signs it in their wallet, and the user-signed bytes go to `POST /sign`.
3. The desk verifies the transaction against its quote byte for byte, co-signs, and the browser broadcasts and confirms it. The position then appears on the Dashboard.

The Dashboard also offers permissionless **Settle** once a settlement price is posted and the dispute window has passed, and `?as=<pubkey>` views any wallet read-only.

**Test funds.** The desk exposes `POST /faucet` (mints test USDC and requests a devnet SOL airdrop); the Earn page shows a *Get test USDC + SOL* button when it is enabled. Devnet SOL is also available at https://faucet.solana.com.

## Running the desk

```bash
cd ../MM-system/breezepocket-mm
npm start                                        # PRICE_SOURCE=deribit; REST on :8787
cloudflared tunnel --url http://localhost:8787   # public URL for the deployed frontend
```

The frontend finds the desk in this order: `?mm=<url>` (remembered in localStorage), `VITE_MM_URL` from the build, then `http://localhost:8787`. A quick tunnel's hostname changes each time it starts, so after restarting it either redeploy with the new `VITE_MM_URL` or open the site once with `?mm=<new url>`.

## Wallet

Connect opens the Solana wallet modal; any Wallet Standard wallet (Phantom, Solflare, Backpack) is detected. The RPC defaults to public devnet; set `VITE_SOLANA_RPC` / `VITE_SOLANA_WS` in `.env` for a keyed endpoint.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Deploy

Hosted on Cloudflare Pages at https://breezepocket-app.pages.dev

```bash
npm run deploy
```

That builds and uploads `dist` to the `breezepocket-app` Pages project. `public/_redirects` sends every path to `index.html` so the client-side routes work on direct load and refresh, and `public/_headers` sets long-lived caching for hashed assets. Project settings live in `wrangler.jsonc`. Deploying requires `wrangler login` once.

## Placeholder data

SOL markets are live. Every other asset row, the leaderboard, the Points page and the Vaults page (stats, thesis copy, epoch history, token addresses) are static placeholders in `src/data/markets.ts`, `src/data/vaults.ts` and the page files.

## Structure

- `src/components` — background grid, nav, footer, logo, wallet button, terminal window, ribbon tabs, icons
- `src/lib/mm.ts`, `src/lib/program.ts` — desk client and browser Anchor client
- `src/hooks/useBalances.ts`, `src/hooks/usePositions.ts` — on-chain balances and positions
- `src/idl/` — program IDL copied from `../core/target/idl`
- `src/pages` — one file per route
- `src/data/markets.ts` — markets, spot prices, strike and premium helpers
- `public/icons` — token, chain and social icons
