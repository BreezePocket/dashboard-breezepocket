import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import WalletButton from './WalletButton'
import { useDesk } from './DeskProvider'
import { isBackend, type DeskHealth } from '../lib/mm'

const LINKS = [
  { to: '/', label: 'Earn' },
  { to: '/vaults', label: 'Vaults' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/points', label: 'Points' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

/** The backend reports how many market makers are online; a raw desk is one. */
const onlineTitle = (health: DeskHealth | null) => {
  const spot = health?.price.spot
  const sol = typeof spot === 'number' ? ` · SOL $${spot.toFixed(2)}` : ''
  if (!isBackend(health)) return `Desk online${sol}`
  const n = health?.mm_count ?? 0
  return n === 0 ? 'No market maker online' : `${n} market maker${n === 1 ? '' : 's'} online${sol}`
}

export default function Nav() {
  const { status, health } = useDesk()
  const deskTitle = status === 'online' ? onlineTitle(health) : status === 'offline' ? 'Market makers unreachable' : 'Connecting to market makers…'
  // A reachable backend with no market maker online cannot quote, so the dot says so too.
  const dot = status === 'online' && isBackend(health) && !health?.mm_count ? 'offline' : status
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
