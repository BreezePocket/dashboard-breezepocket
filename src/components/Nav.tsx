import { NavLink, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import WalletButton from './WalletButton'
import { useDesk } from './DeskProvider'
import { MoonIcon, SunIcon } from './Icons'
import { isBackend, type DeskHealth } from '../lib/mm'
import type { Theme } from '../lib/theme'

const LINKS = [
  { to: '/', label: 'Earn' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

/** The backend says whether quotes are live, never how many market makers are behind them. */
const onlineTitle = (health: DeskHealth | null) => {
  const spot = health?.price.spot
  const sol = typeof spot === 'number' ? ` · SOL $${spot.toFixed(2)}` : ''
  if (!isBackend(health)) return `Desk online${sol}`
  return health?.ok ? `Live quotes${sol}` : 'Quotes unavailable'
}

export default function Nav({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { status, health } = useDesk()
  // An asset page (/earn) belongs to Earn, so that link stays marked there too.
  const { pathname } = useLocation()
  const onEarn = pathname === '/' || pathname.startsWith('/earn')
  const deskTitle = status === 'online' ? onlineTitle(health) : status === 'offline' ? 'Market makers unreachable' : 'Connecting to market makers…'
  // A reachable backend that cannot quote right now shows as offline too.
  const dot = status === 'online' && isBackend(health) && !health?.ok ? 'offline' : status
  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-logo" aria-label="PAYtience home">
          <Logo size={30} />
        </NavLink>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-link ${(l.to === '/' ? onEarn : isActive) ? 'active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <span className={`net-pill desk-${dot}`} title={deskTitle}>
          <span className="net-dot" /><span className="net-label">devnet</span>
        </span>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <WalletButton />
      </div>
    </header>
  )
}
