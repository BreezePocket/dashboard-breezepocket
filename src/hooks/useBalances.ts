import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, type PublicKey } from '@solana/web3.js'
import { ata, fetchConfig } from '../lib/program'

export type Balances = { sol: number | null; usdc: number | null; usdcMint: PublicKey | null }

/** SOL and test-USDC balances for an owner (defaults to the connected wallet), refreshed every 15s. */
export function useBalances(owner?: PublicKey | null) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const target = owner === undefined ? publicKey : owner
  const [bal, setBal] = useState<Balances>({ sol: null, usdc: null, usdcMint: null })

  const refresh = useCallback(async () => {
    if (!target) {
      setBal({ sol: null, usdc: null, usdcMint: null })
      return
    }
    try {
      const cfg = await fetchConfig(connection)
      const [lamports, token] = await Promise.all([
        connection.getBalance(target, 'confirmed'),
        connection.getTokenAccountBalance(ata(cfg.usdcMint, target), 'confirmed').catch(() => null),
      ])
      setBal({ sol: lamports / LAMPORTS_PER_SOL, usdc: token ? Number(token.value.uiAmount ?? 0) : 0, usdcMint: cfg.usdcMint })
    } catch {
      /* keep the previous values on transient RPC errors */
    }
  }, [connection, target])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [refresh])

  return { ...bal, refresh }
}
