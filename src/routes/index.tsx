

import { CatalogSection, FilterSidebar } from '@/features/catalog/components/catalog-section'
import { MobileCatalogToolbar } from '@/features/catalog/components/mobile-catalog-toolbar'
import { HeroBanner } from '@/features/catalog/components/hero-banner'
import { MobileBottomNav } from '@/features/catalog/components/mobile-bottom-nav'
import { PromotionalBanners } from '@/features/catalog/components/promotional-banners'
import { EditorialSection } from '@/features/catalog/components/editorial-section'
import { Footer } from '@/components/layout/footer'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getNfts, type CatalogSearch } from '@/features/catalog/catalog-api'

const sorts = ['recent', 'price_asc', 'price_desc', 'name_asc'] as const
const optionalString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined

export const Route = createFileRoute('/')({
  validateSearch: (raw): CatalogSearch => ({
    q: optionalString(raw.q),
    category: optionalString(raw.category),
    network: optionalString(raw.network),
    minPrice: optionalString(raw.minPrice),
    maxPrice: optionalString(raw.maxPrice),
    sort: sorts.find((value) => value === raw.sort) ?? 'recent',
    page: Number.isSafeInteger(Number(raw.page)) && Number(raw.page) > 0 ? Number(raw.page) : 1,
  }),
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const {
    data,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['nfts', 'catalog', search],
    queryFn: ({ signal }) => getNfts(signal, search),
  })

  function changeSearch(patch: Partial<CatalogSearch>) {
    void navigate({ search: (previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }), hash: 'catalogo' })
  }

  return (
    <main className="min-h-screen bg-background p-6 pb-28 text-foreground lg:p-8">
      <MobileCatalogToolbar key={search.q ?? ''} searchValue={search.q} onSearchSubmit={(q) => changeSearch({ q: q.trim() || undefined })} onOpenFilters={() => setFiltersOpen((value) => !value)} />
      <div className="-mt-4 lg:mt-0">
        <HeroBanner />
      </div>

      <div id="catalogo" className="mt-8 lg:mt-12">
        <form key={search.q ?? ''} role="search" aria-label="Busca de NFTs" className="mx-auto mb-5 hidden max-w-[1200px] justify-end gap-2 lg:flex" onSubmit={(event) => { event.preventDefault(); changeSearch({ q: new FormData(event.currentTarget).get('q')?.toString().trim() || undefined }) }}>
          <input name="q" type="search" aria-label="Buscar NFTs" defaultValue={search.q} placeholder="Buscar NFTs" className="w-64 rounded bg-sidebar px-3 py-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-primary" />
          <button type="submit" className="rounded bg-primary px-3 py-2 text-xs font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Buscar</button>
        </form>
        {filtersOpen && <div className="mb-5 lg:hidden"><FilterSidebar facets={data?.facets} search={search} onChange={changeSearch} /></div>}
        {isPending && (
          <p role="status" className="text-yellow-400">
            Carregando NFTs...
          </p>
        )}

        {isError && (
          <div role="alert">
            <p className="mb-4 text-red-400">
              Erro ao carregar os NFTs.
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded bg-orange-500 px-4 py-2 text-black"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {data && <CatalogSection nfts={data.data} total={data.total} totalPages={data.totalPages} facets={data.facets} search={search} onChange={changeSearch} />}
        {isFetching && !isPending && <p role="status" className="mt-2 text-xs text-text-secondary">Atualizando catálogo...</p>}
      </div>
      <PromotionalBanners />
      <EditorialSection />
      <Footer />
      <MobileBottomNav />
    </main>
  )
}
