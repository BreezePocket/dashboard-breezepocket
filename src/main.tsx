import './polyfills'
import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import { RPC_URL, WS_URL } from './lib/config'
import App from './App'
import Earn from './pages/Earn'
import EarnDetail from './pages/EarnDetail'
import Vaults from './pages/Vaults'
import VaultDetail from './pages/VaultDetail'
import Dashboard from './pages/Dashboard'
import Points from './pages/Points'
import Leaderboard from './pages/Leaderboard'


function Root() {
  // Wallets that implement the Wallet Standard (Phantom, Solflare, Backpack, …) are detected automatically.
  const wallets = useMemo(() => [], [])
  return (
    <ConnectionProvider endpoint={RPC_URL} config={{ commitment: 'confirmed', wsEndpoint: WS_URL }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<App />}>
                <Route index element={<Earn />} />
                <Route path="earn" element={<EarnDetail />} />
                <Route path="vaults" element={<Vaults />} />
                <Route path="vault/:id" element={<VaultDetail />} />
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
