import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import WalletButton from './WalletButton'

const LINKS = [
  { to: '/', label: 'Earn' },
  { to: '/vaults', label: 'Vaults' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/points', label: 'Points' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export default function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" className="nav-logo" aria-label="BreezePocket home">
        <Logo size={44} />
      </NavLink>
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          {l.label}
        </NavLink>
      ))}
      <div className="nav-spacer" />
      <WalletButton />
    </nav>
  )
}
