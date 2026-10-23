import { http, HttpResponse } from 'msw'
import { userIdFromRequest } from './auth-handlers'
import { catalogSnapshot } from './commerce-handlers'

type Favorite = { userId: string; nftId: string }
const FAVORITES_KEY = 'kurio-demo-favorites-v1'
const FAIL_ONCE_KEY = 'kurio-demo-favorites-fail-once-v1'

function load(): Favorite[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    return Array.isArray(value) ? value as Favorite[] : []
  } catch { return [] }
}

function failOnce(method: string): boolean {
  if (sessionStorage.getItem(FAIL_ONCE_KEY) !== method) return false
  sessionStorage.removeItem(FAIL_ONCE_KEY)
  return true
}

const unauthorized = () => HttpResponse.json({ message: 'Sessão inválida ou expirada.' }, { status: 401 })
const unavailable = () => HttpResponse.json({ message: 'Favoritos temporariamente indisponíveis.' }, { status: 503 })

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const userId = userIdFromRequest(request)
    if (!userId) return unauthorized()
    if (failOnce('GET')) return unavailable()
    return HttpResponse.json({ data: load().filter((item) => item.userId === userId).map((item) => item.nftId) })
  }),
  http.post('/api/favorites', async ({ request }) => {
    const userId = userIdFromRequest(request)
    if (!userId) return unauthorized()
    if (failOnce('POST')) return unavailable()
    const body: unknown = await request.json()
    const nftId = body && typeof body === 'object' && 'nftId' in body ? body.nftId : null
    if (typeof nftId !== 'string' || !nftId.trim()) return HttpResponse.json({ message: 'NFT inválido.' }, { status: 422 })
    if (!catalogSnapshot().some((item) => item.id === nftId)) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    const favorites = load()
    if (!favorites.some((item) => item.userId === userId && item.nftId === nftId)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites, { userId, nftId }]))
    }
    return HttpResponse.json({ data: { nftId } })
  }),
  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const userId = userIdFromRequest(request)
    if (!userId) return unauthorized()
    if (failOnce('DELETE')) return unavailable()
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(load().filter((item) => item.userId !== userId || item.nftId !== params.nftId)))
    return new HttpResponse(null, { status: 204 })
  }),
]
