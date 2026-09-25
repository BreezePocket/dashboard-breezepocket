import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Background from './components/Background'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { DeskProvider } from './components/DeskProvider'

const TITLES: Record<string, string> = {
  '/': 'BreezePocket | Earn upfront on your crypto',
  '/earn': 'BreezePocket | Earn',
  '/vaults': 'BreezePocket | Vaults',
  '/dashboard': 'BreezePocket | Dashboard',
  '/points': 'BreezePocket | Points',
  '/leaderboard': 'BreezePocket | Leaderboard',
}

export default function App() {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'
  const dark = path === '/vaults' || path.startsWith('/vault/')

  useEffect(() => {
    document.title = TITLES[path] ?? (path.startsWith('/vault/') ? 'BreezePocket | Vault' : 'BreezePocket')
    document.body.style.background = dark ? '#000' : ''
    document.body.dataset.theme = dark ? 'dark' : 'light'
    window.scrollTo(0, 0)
  }, [path, dark])

  return (
    <DeskProvider>
      <div className="app" data-theme={dark ? 'dark' : 'light'}>
        <Background />
        <Nav />
        <main className="main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </DeskProvider>
  )
}
