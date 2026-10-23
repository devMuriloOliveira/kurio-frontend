import { api } from '@/lib/api'

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function getFavorites(token: string): Promise<string[]> {
  const response = await api.get<{ data: string[] }>('/favorites', { headers: authHeaders(token) })
  return response.data.data
}

export async function addFavorite(token: string, nftId: string): Promise<void> {
  await api.post('/favorites', { nftId }, { headers: authHeaders(token) })
}

export async function removeFavorite(token: string, nftId: string): Promise<void> {
  await api.delete(`/favorites/${encodeURIComponent(nftId)}`, { headers: authHeaders(token) })
}
