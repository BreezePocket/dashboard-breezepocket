import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { DeskClient, resolveDesk, type DeskHealth } from '../lib/mm'

type Status = 'connecting' | 'online' | 'offline'
type Ctx = { client: DeskClient | null; health: DeskHealth | null; status: Status; url: string | null; refresh: () => void }

const DeskContext = createContext<Ctx>({ client: null, health: null, status: 'connecting', url: null, refresh: () => {} })

const HEALTH_POLL_MS = 10_000
const RETRY_MS = 15_000

/** Finds the market-maker desk and keeps its /health fresh for the whole app. */
export function DeskProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<DeskClient | null>(null)
  const [health, setHealth] = useState<DeskHealth | null>(null)
  const [status, setStatus] = useState<Status>('connecting')
  const clientRef = useRef<DeskClient | null>(null)

  const connect = useCallback(async () => {
    const found = await resolveDesk()
    if (found) {
      clientRef.current = found.client
      setClient(found.client)
      setHealth(found.health)
      setStatus('online')
    } else {
      clientRef.current = null
      setClient(null)
      setHealth(null)
      setStatus('offline')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    connect()
    const id = setInterval(async () => {
      if (cancelled) return
      const c = clientRef.current
      if (!c) {
        connect()
        return
      }
      try {
        setHealth(await c.health(5000))
        setStatus('online')
      } catch {
        setStatus('offline')
        connect()
      }
    }, clientRef.current ? HEALTH_POLL_MS : RETRY_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [connect])

  return <DeskContext.Provider value={{ client, health, status, url: client?.baseUrl ?? null, refresh: connect }}>{children}</DeskContext.Provider>
}

export const useDesk = () => useContext(DeskContext)
