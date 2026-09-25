import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { fetchPositionsForUser, fetchSettlementPrice, priceKey, type PositionRow, type SettlementPriceRow } from '../lib/program'

/** On-chain positions for a wallet plus any posted settlement price per asset and expiry (see `priceKey`), refreshed every 20s. */
export function usePositions(owner: PublicKey | null) {
  const { connection } = useConnection()
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [prices, setPrices] = useState<Record<string, SettlementPriceRow | null>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!owner) {
      setPositions([])
      setPrices({})
      return
    }
    setLoading(true)
    try {
      const rows = await fetchPositionsForUser(connection, owner)
      setPositions(rows)
      const keys = new Map(rows.map((r) => [priceKey(r), r]))
      const entries = await Promise.all(
        [...keys].map(async ([k, r]) => [k, await fetchSettlementPrice(connection, r.expiryTs, r.assetMint).catch(() => null)] as const),
      )
      setPrices(Object.fromEntries(entries))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [connection, owner])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 20_000)
    return () => clearInterval(id)
  }, [refresh])

  return { positions, prices, loading, error, refresh }
}
