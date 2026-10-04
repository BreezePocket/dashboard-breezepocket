import { useEffect, useRef, useState } from 'react'
import { explorerAddr } from '../lib/config'
import { useWallet } from '../lib/wallet'

export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`

/** Log in; once logged in, the address with a small account menu behind it. */
export default function WalletButton() {
  const { ready, publicKey, wallet, identity, connecting, needsWallet, login, logout, exportKey } = useWallet()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const addr = publicKey?.toBase58()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!addr) {
    const label = !ready ? 'Loading…' : connecting ? 'Setting up…' : needsWallet ? 'Reconnect wallet' : 'Log in'
    return (
      <button
        type="button"
        className="connect"
        disabled={!ready || connecting}
        onClick={login}
        title={needsWallet ? 'Your wallet is not connected in this browser' : 'Log in with Google, a phone number or a Solana wallet'}
      >
        <span className="connect-chain"><img src="/icons/solana.svg" alt="Solana" /></span>
        <span className="connect-label">{label}</span>
      </button>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the address is still behind the Explorer link */
    }
  }

  return (
    <div className="connect-wrap" ref={ref}>
      <button
        type="button"
        // A logged-in button shows the address, which must keep its case; only the call to action is set in capitals.
        className="connect is-connected"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Your account"
      >
        <span className="connect-chain">
          {wallet?.icon ? <img src={wallet.icon} alt={wallet.name} /> : <img src="/icons/solana.svg" alt="Solana" />}
        </span>
        <span className="connect-label">{shortAddr(addr)}</span>
      </button>
      {open && (
        <div className="chip-menu connect-menu" role="menu" aria-label="Your account">
          {identity && <p className="connect-who">{identity}</p>}
          <button type="button" role="menuitem" onClick={copy}>{copied ? 'Copied' : 'Copy address'}</button>
          <a role="menuitem" href={explorerAddr(addr)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>View on Solana Explorer</a>
          {exportKey && (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); exportKey().catch(() => {}) }}>Export wallet key</button>
          )}
          <button type="button" role="menuitem" onClick={() => { setOpen(false); logout().catch(() => {}) }}>Log out</button>
        </div>
      )}
    </div>
  )
}
