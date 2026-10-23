
import { authHandlers } from './auth-handlers'
import { delay, http, HttpResponse } from 'msw'
import { commerceHandlers, catalogSnapshot } from './commerce-handlers'
import { favoriteHandlers } from './favorites-handlers'
import { parseEthToWei } from '@/features/cart/eth'
import type { NFT } from '@/types/nft'

function facets(nfts: NFT[]) {
  const count = (values: (string | undefined)[]) => [...new Set(values.filter((value): value is string => Boolean(value)))]
    .map((value) => ({ value, count: values.filter((item) => item === value).length }))
  return {
    categories: count(nfts.map((nft) => nft.category)),
    networks: count(nfts.map((nft) => nft.network)),
  }
}

function priceWei(nft: NFT): bigint | null {
  try { return nft.priceEth ? parseEthToWei(nft.priceEth) : null }
  catch { return null }
}

export const handlers = [
  ...authHandlers,
  ...commerceHandlers,
  ...favoriteHandlers,
  // Verifica se a API simulada está funcionando
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      message: 'API simulada do KURIO funcionando!',
    })
  }),

  // Retorna o catálogo de NFTs
  http.get('/api/nfts', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const catalog = catalogSnapshot()
    const query = params.get('q')?.trim().toLocaleLowerCase('pt-BR')
    if (query && sessionStorage.getItem('kurio-demo-catalog-delay-q-v1')?.toLocaleLowerCase('pt-BR') === query) await delay(650)
    if (sessionStorage.getItem('kurio-demo-catalog-error-v1') === '1') return HttpResponse.json({ message: 'Catálogo temporariamente indisponível.' }, { status: 503 })
    const category = params.get('category')
    const network = params.get('network')
    const sort = params.get('sort') ?? 'recent'
    const requestedPage = params.get('page')
    const page = requestedPage === null ? 1 : Number(requestedPage)
    if (!Number.isSafeInteger(page) || page < 1 || !['recent', 'price_asc', 'price_desc', 'name_asc'].includes(sort)) {
      return HttpResponse.json({ message: 'Parâmetros do catálogo inválidos.' }, { status: 422 })
    }
    let minPrice: bigint | null = null
    let maxPrice: bigint | null = null
    try {
      if (params.has('minPrice')) minPrice = parseEthToWei(params.get('minPrice')!)
      if (params.has('maxPrice')) maxPrice = parseEthToWei(params.get('maxPrice')!)
    } catch { return HttpResponse.json({ message: 'Faixa de preço inválida.' }, { status: 422 }) }
    if ((minPrice !== null && minPrice < 0n) || (maxPrice !== null && maxPrice < 0n) || (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) {
      return HttpResponse.json({ message: 'Faixa de preço inválida.' }, { status: 422 })
    }
    const filtered = catalog.filter((nft) => {
      if (query && ![nft.name, nft.collection, nft.category, nft.description].some((value) => value?.toLocaleLowerCase('pt-BR').includes(query))) return false
      if (category && nft.category !== category) return false
      if (network && nft.network !== network) return false
      const price = priceWei(nft)
      if (minPrice !== null && (price === null || price < minPrice)) return false
      if (maxPrice !== null && (price === null || price > maxPrice)) return false
      return true
    })
    if (sort === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    else if (sort === 'price_asc' || sort === 'price_desc') filtered.sort((a, b) => {
      const left = priceWei(a)
      const right = priceWei(b)
      if (left === null) return right === null ? 0 : 1
      if (right === null) return -1
      return sort === 'price_asc' ? (left < right ? -1 : left > right ? 1 : 0) : (left > right ? -1 : left < right ? 1 : 0)
    })
    const pageSize = requestedPage === null ? Math.max(1, filtered.length) : 6
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    return HttpResponse.json({
      data: requestedPage === null ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages,
      facets: facets(catalog),
    })
  }),

  http.get('/api/nfts/:id', ({ params }) => {
    const nft = catalogSnapshot().find((item) => item.id === params.id)

    if (!nft) {
      return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    }

    return HttpResponse.json({ data: nft })
  }),
]
