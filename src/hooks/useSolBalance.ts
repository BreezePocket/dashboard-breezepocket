import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

/** SOL balance of the connected wallet, refreshed on connect and every 30s. `null` while unknown. */
export function useSolBalance() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!publicKey) { setBalance(null); return }
    let cancelled = false
    const load = () =>
      connection.getBalance(publicKey).then((l) => { if (!cancelled) setBalance(l / LAMPORTS_PER_SOL) }).catch(() => {})
    load()
    const id = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [connection, publicKey])

  return balance
}
