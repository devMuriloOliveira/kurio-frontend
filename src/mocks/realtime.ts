import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

type Session = { token: string; userId: string }
type EventPayload = {
  eventId: string
  version: number
  resource: { type: 'nft' | 'order'; id: string }
  status?: 'pending' | 'confirmed' | 'declined'
  priceEth?: string
  availableQuantity?: number
}

function sessionUserId(token: string | null): string | null {
  if (!token) return null
  try {
    const sessions = JSON.parse(localStorage.getItem('kurio-demo-sessions-v1') ?? '[]') as Session[]
    return sessions.find((session) => session.token === token)?.userId ?? null
  } catch { return null }
}

const clients = new Set<{ token: string | null; emit: (name: string, payload: EventPayload) => void }>()
const link = ws.link(/\/__kurio_socket__\/?(?:\?.*)?$/)

export const realtimeHandler = link.addEventListener('connection', (connection) => {
  const token = connection.client.url.searchParams.get('token')
  if (token && !sessionUserId(token)) { connection.client.close(1008, 'Sessão inválida'); return }
  const io = toSocketIo(connection)
  const client = { token, emit: (name: string, payload: EventPayload) => io.client.emit(name, payload) }
  clients.add(client)
  connection.client.addEventListener('close', () => clients.delete(client))
})

export function emitNftUpdated(nft: { id: string; version?: number; priceEth?: string; availableQuantity?: number }) {
  const version = nft.version ?? 1
  const payload: EventPayload = { eventId: `nft:${nft.id}:${version}`, version, resource: { type: 'nft', id: nft.id }, priceEth: nft.priceEth, availableQuantity: nft.availableQuantity }
  for (const client of clients) client.emit('nft.updated', payload)
}

export function emitOrderUpdated(order: { id: string; userId: string; version?: number; status: 'pending' | 'confirmed' | 'declined' }) {
  const version = order.version ?? 1
  const payload: EventPayload = { eventId: `order:${order.id}:${version}`, version, resource: { type: 'order', id: order.id }, status: order.status }
  for (const client of clients) {
    if (sessionUserId(client.token) === order.userId) client.emit('order.updated', payload)
  }
}
