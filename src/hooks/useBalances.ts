import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { ata, fetchConfig } from '../lib/program'

/** `asset` is the balance of `assetMint`, when one is asked for. */
export type Balances = { sol: number | null; usdc: number | null; asset: number | null; usdcMint: PublicKey | null }

/**
 * SOL and test-USDC balances for an owner (defaults to the connected wallet), plus a
 * listed asset's token balance when `assetMint` is given, refreshed every 15s.
 */
export function useBalances(owner?: PublicKey | null, assetMint?: PublicKey | null) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const target = owner === undefined ? publicKey : owner
  const [bal, setBal] = useState<Balances>({ sol: null, usdc: null, asset: null, usdcMint: null })
  const mintKey = assetMint?.toBase58() ?? null

  const refresh = useCallback(async () => {
    if (!target) {
      setBal({ sol: null, usdc: null, asset: null, usdcMint: null })
      return
    }
    try {
      const cfg = await fetchConfig(connection)
      const tokenBalance = (mint: PublicKey) =>
        connection.getTokenAccountBalance(ata(mint, target), 'confirmed').then((t) => Number(t.value.uiAmount ?? 0)).catch(() => 0)
      const [lamports, usdc, asset] = await Promise.all([
        connection.getBalance(target, 'confirmed'),
        tokenBalance(cfg.usdcMint),
        mintKey ? tokenBalance(new PublicKey(mintKey)) : Promise.resolve(null),
      ])
      setBal({ sol: lamports / LAMPORTS_PER_SOL, usdc, asset, usdcMint: cfg.usdcMint })
    } catch {
      /* keep the previous values on transient RPC errors */
    }
  }, [connection, target, mintKey])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [refresh])

  return { ...bal, refresh }
}
