import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`

export default function WalletButton() {
  const { publicKey, connecting, disconnect, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const addr = publicKey?.toBase58()

  return (
    <button
      type="button"
      className="connect"
      onClick={() => (addr ? disconnect() : setVisible(true))}
      title={addr ? 'Disconnect wallet' : 'Connect a Solana wallet'}
    >
      <span className="connect-chain">
        {addr && wallet?.adapter.icon ? <img src={wallet.adapter.icon} alt={wallet.adapter.name} /> : <img src="/icons/solana.svg" alt="Solana" />}
      </span>
      <span className="connect-label">{addr ? shortAddr(addr) : connecting ? 'Connecting…' : 'Connect'}</span>
    </button>
  )
}
