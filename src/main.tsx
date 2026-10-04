import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { WalletProvider } from './components/WalletProvider'
import App from './App'
import Earn from './pages/Earn'
import EarnDetail from './pages/EarnDetail'
import Vaults from './pages/Vaults'
import VaultDetail from './pages/VaultDetail'
import Dashboard from './pages/Dashboard'
import Points from './pages/Points'
import Leaderboard from './pages/Leaderboard'


function Root() {
  return (
    <WalletProvider>
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
    </WalletProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
