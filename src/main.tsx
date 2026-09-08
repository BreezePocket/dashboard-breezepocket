import { Buffer } from 'buffer'
import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import App from './App'
import Earn from './pages/Earn'
import EarnDetail from './pages/EarnDetail'
import Vaults from './pages/Vaults'
import Dashboard from './pages/Dashboard'
import Points from './pages/Points'
import Leaderboard from './pages/Leaderboard'

// @solana/web3.js expects Node's Buffer to exist in the browser.
if (!(globalThis as { Buffer?: unknown }).Buffer) (globalThis as { Buffer?: unknown }).Buffer = Buffer

export const RPC_ENDPOINT = import.meta.env.VITE_SOLANA_RPC || clusterApiUrl('mainnet-beta')

function Root() {
  // Wallets that implement the Wallet Standard (Phantom, Solflare, Backpack, …) are detected automatically.
  const wallets = useMemo(() => [], [])
  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<App />}>
                <Route index element={<Earn />} />
                <Route path="earn" element={<EarnDetail />} />
                <Route path="vaults" element={<Vaults />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="points" element={<Points />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="*" element={<Earn />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
