import { io, type Socket } from 'socket.io-client'
import { getAuthToken, subscribeToAuth } from '@/features/auth/auth-api'
import { queryClient } from '@/lib/query-client'

type EventPayload = { eventId: string; version: number; resource: { type: 'nft' | 'order'; id: string } }

export function startRealtime() {
  let socket: Socket | null = null
  let token = getAuthToken()
  const versions = new Map<string, number>()
  const seen = new Set<string>()

  function accept(event: EventPayload, type: 'nft' | 'order'): boolean {
    if (!event || event.resource?.type !== type || typeof event.resource.id !== 'string' || !Number.isSafeInteger(event.version) || event.version < 1 || typeof event.eventId !== 'string') return false
    const key = `${type}:${event.resource.id}`
    if (seen.has(event.eventId) || event.version <= (versions.get(key) ?? 0)) return false
    seen.add(event.eventId)
    versions.set(key, event.version)
    return true
  }

  function disconnect() {
    socket?.removeAllListeners()
    socket?.disconnect()
    socket = null
    seen.clear()
    versions.clear()
  }

  function connect() {
    disconnect()
    socket = io(location.origin, { path: '/__kurio_socket__', transports: ['websocket'], query: token ? { token } : {}, reconnection: true })
    socket.on('connect', () => {
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      if (token) void queryClient.invalidateQueries({ queryKey: ['orders', token] })
    })
    socket.on('nft.updated', (event: EventPayload) => {
      if (accept(event, 'nft')) void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    })
    socket.on('order.updated', (event: EventPayload) => {
      if (token && accept(event, 'order')) void queryClient.invalidateQueries({ queryKey: ['orders', token, event.resource.id] })
    })
  }

  const onAuthChange = () => {
    const nextToken = getAuthToken()
    if (nextToken !== token) { token = nextToken; connect() }
  }
  const unsubscribe = subscribeToAuth(onAuthChange)
  window.addEventListener('beforeunload', disconnect)
  connect()
  return () => { unsubscribe(); window.removeEventListener('beforeunload', disconnect); disconnect() }
}
