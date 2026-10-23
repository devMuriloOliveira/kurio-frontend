
import { api } from '@/lib/api'
import type { NFT } from '@/types/nft'

export type NftsResponse = {
  data: NFT[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  facets: {
    categories: { value: string; count: number }[]
    networks: { value: string; count: number }[]
  }
}

export type CatalogSearch = {
  q?: string
  category?: string
  network?: string
  minPrice?: string
  maxPrice?: string
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'name_asc'
  page?: number
}

export async function getNfts(
  signal?: AbortSignal,
  search?: CatalogSearch,
): Promise<NftsResponse> {
  const response = await api.get<NftsResponse>('/nfts', {
    signal,
    params: search,
  })

  return response.data
}

export async function getNft(id: string, signal?: AbortSignal): Promise<NFT> {
  const response = await api.get<{ data: NFT }>(`/nfts/${encodeURIComponent(id)}`, {
    signal,
  })

  return response.data.data
}
