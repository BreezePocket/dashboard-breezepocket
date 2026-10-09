import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { DeskProvider } from './components/DeskProvider'
import { useTheme } from './lib/theme'

const TITLES: Record<string, string> = {
  '/': 'PAYtience | Get paid while you wait',
  '/earn': 'PAYtience | Earn',
  '/vaults': 'PAYtience | Vaults',
  '/dashboard': 'PAYtience | Dashboard',
  '/points': 'PAYtience | Points',
  '/leaderboard': 'PAYtience | Leaderboard',
}

/** The browser chrome on a phone takes the colour of the frame around the page. */
const THEME_COLOR = { light: '#2f4436', dark: '#1f3026', vault: '#161616' }

export default function App() {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'
  const [theme, toggleTheme] = useTheme()
  // The vault pages are dark only, whichever theme is picked.
  const applied = path === '/vaults' || path.startsWith('/vault/') ? 'vault' : theme

  useEffect(() => {
    document.title = TITLES[path] ?? (path.startsWith('/vault/') ? 'PAYtience | Vault' : 'PAYtience')
    window.scrollTo(0, 0)
  }, [path])

  // The theme lives on <html>, so it also reaches the wallet dialog, which renders outside the app.
  useEffect(() => {
    document.documentElement.dataset.theme = applied
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[applied])
  }, [applied])

  return (
    <DeskProvider>
      <div className="app">
        <Nav theme={theme} onToggleTheme={toggleTheme} />
        <main className="main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </DeskProvider>
  )
}
