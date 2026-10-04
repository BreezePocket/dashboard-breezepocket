import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import WalletButton from './WalletButton'
import { useDesk } from './DeskProvider'
import { isBackend, type DeskHealth } from '../lib/mm'

const LINKS = [
  { to: '/', label: 'Earn' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/points', label: 'Points' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

/** The backend says whether quotes are live, never how many market makers are behind them. */
const onlineTitle = (health: DeskHealth | null) => {
  const spot = health?.price.spot
  const sol = typeof spot === 'number' ? ` · SOL $${spot.toFixed(2)}` : ''
  if (!isBackend(health)) return `Desk online${sol}`
  return health?.ok ? `Live quotes${sol}` : 'Quotes unavailable'
}

export default function Nav() {
  const { status, health } = useDesk()
  const deskTitle = status === 'online' ? onlineTitle(health) : status === 'offline' ? 'Market makers unreachable' : 'Connecting to market makers…'
  // A reachable backend that cannot quote right now shows as offline too.
  const dot = status === 'online' && isBackend(health) && !health?.ok ? 'offline' : status
  return (
    <nav className="nav">
      <NavLink to="/" className="nav-logo" aria-label="PAYtience home">
        <Logo size={44} />
      </NavLink>
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          {l.label}
        </NavLink>
      ))}
      <div className="nav-spacer" />
      <span className={`net-pill desk-${dot}`} title={deskTitle}>
        <span className="net-dot" />devnet
      </span>
      <WalletButton />
    </nav>
  )
}
