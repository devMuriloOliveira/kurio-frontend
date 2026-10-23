import { ChevronRight } from 'lucide-react'

import { NFTCard } from '@/features/catalog/components/nft-card'
import type { CatalogSearch, NftsResponse } from '@/features/catalog/catalog-api'
import type { NFT } from '@/types/nft'

type ChangeSearch = (patch: Partial<CatalogSearch>) => void
type Facets = NftsResponse['facets']
type FilterProps = { facets?: Facets; search: CatalogSearch; onChange: ChangeSearch }
const networkLabels: Record<string, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }

export function FilterSidebar({ facets, search, onChange }: FilterProps) {
  return (
    <aside aria-label="Filtros do catálogo" className="space-y-4">
      <div className="bg-sidebar px-4 py-5 text-[11px]">
        <h2 className="font-bold text-foreground">Categorias</h2>
        <ul className="mt-3 space-y-2.5 text-text-secondary">
          {facets?.categories.map(({ value, count }) => <li key={value}>
            <button type="button" aria-pressed={search.category === value} onClick={() => onChange({ category: search.category === value ? undefined : value })} className="flex w-full justify-between gap-3 rounded-sm pl-2 text-left transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:text-primary">
              <span>{value}</span><span>({count})</span>
            </button>
          </li>)}
        </ul>

        <h2 className="mt-7 font-bold text-foreground">Faixa de preço</h2>
        <form key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}`} className="mt-3 space-y-2" onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          onChange({ minPrice: form.get('minPrice')?.toString() || undefined, maxPrice: form.get('maxPrice')?.toString() || undefined })
        }}>
          <div className="flex gap-2">
            <label className="min-w-0 flex-1">Mín. ETH<input name="minPrice" type="number" min="0" step="any" defaultValue={search.minPrice} className="mt-1 w-full rounded border border-primary/30 bg-background px-2 py-1 text-foreground focus-visible:outline-2 focus-visible:outline-primary" /></label>
            <label className="min-w-0 flex-1">Máx. ETH<input name="maxPrice" type="number" min="0" step="any" defaultValue={search.maxPrice} className="mt-1 w-full rounded border border-primary/30 bg-background px-2 py-1 text-foreground focus-visible:outline-2 focus-visible:outline-primary" /></label>
          </div>
          <button type="submit" className="rounded bg-primary px-2.5 py-1 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Aplicar</button>
        </form>

        <h2 className="mt-7 font-bold text-foreground">Rede</h2>
        <ul className="mt-3 space-y-2.5 text-text-secondary">
          {facets?.networks.map(({ value, count }) => <li key={value}>
            <button type="button" aria-pressed={search.network === value} onClick={() => onChange({ network: search.network === value ? undefined : value })} className="flex w-full justify-between gap-3 rounded-sm pl-2 text-left transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:text-primary">
              <span>{networkLabels[value] ?? value}</span><span>({count})</span>
            </button>
          </li>)}
        </ul>
        {(search.q || search.category || search.network || search.minPrice || search.maxPrice) && <button type="button" onClick={() => onChange({ q: undefined, category: undefined, network: undefined, minPrice: undefined, maxPrice: undefined })} className="mt-5 text-primary underline focus-visible:outline-2 focus-visible:outline-primary">Limpar filtros</button>}
      </div>

      <div className="overflow-hidden bg-sidebar pt-4">
        <h2 className="px-4 text-sm font-bold text-primary">NFT EM DESTAQUE</h2>
        <p className="mt-1 px-4 text-xs font-bold text-foreground">OFERTA LIMITADA</p>
        <img src="/images/sage-nomad.png" alt="Sage Nomad, NFT em destaque" loading="lazy" className="mt-3 aspect-square w-full rounded-t-xl object-cover" />
      </div>
    </aside>
  )
}

type CatalogSectionProps = FilterProps & { nfts: NFT[]; total: number; totalPages: number }

export function CatalogSection({ nfts, total, totalPages, facets, search, onChange }: CatalogSectionProps) {
  const page = search.page ?? 1
  return (
    <section aria-label="Catálogo de NFTs" className="mx-auto max-w-[1200px] lg:grid lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
      <div className="hidden lg:block"><FilterSidebar facets={facets} search={search} onChange={onChange} /></div>
      <div className="mx-auto min-w-0 max-w-[600px] lg:mx-0 lg:max-w-none">
        <div className="mb-4 flex min-w-0 items-end justify-between gap-4 border-b border-foreground/10 lg:mb-5">
          <nav aria-label="Abas do catálogo" className="flex min-w-0 gap-3 overflow-x-auto whitespace-nowrap text-[10px] sm:gap-5 lg:text-xs">
            <span aria-current="page" className="border-b-2 border-primary pb-2 font-bold text-primary">Todos os NFTs</span>
            <button type="button" disabled title="Novos lançamentos em breve" className="pb-2 text-foreground/80 disabled:cursor-not-allowed">Novos lançamentos<span className="sr-only">, indisponível</span></button>
            <button type="button" disabled title="Em alta em breve" className="pb-2 text-foreground/80 disabled:cursor-not-allowed">Em alta<span className="sr-only">, indisponível</span></button>
          </nav>
        </div>
        <div className="mb-5 flex min-w-0 flex-wrap items-end gap-3">
          <label className="ml-auto flex items-center gap-2 text-xs text-text-secondary">Ordenar por:
            <select aria-label="Ordenar NFTs" value={search.sort ?? 'recent'} onChange={(event) => onChange({ sort: event.currentTarget.value as CatalogSearch['sort'] })} className="max-w-[160px] rounded bg-sidebar px-2 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-primary">
              <option value="recent">Ordem do catálogo</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name_asc">Nome A–Z</option>
            </select>
          </label>
        </div>
        <p className="mb-3 text-xs text-text-secondary" role="status">{total} {total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}</p>
        {nfts.length > 0 ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-[repeat(2,258px)] lg:gap-x-[34px] lg:gap-y-[62px] xl:grid-cols-[repeat(3,258px)]">
          {nfts.map((nft) => <div key={nft.id} className="min-w-0"><NFTCard nft={nft} /></div>)}
        </div> : <p className="rounded bg-sidebar p-8 text-center text-sm text-text-secondary">Nenhum NFT encontrado para estes filtros.</p>}
        <nav aria-label="Paginação do catálogo" className="mt-10 flex flex-wrap justify-end gap-1">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" aria-label={`Página ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onChange({ page: number })} className={`flex size-7 items-center justify-center rounded border text-xs focus-visible:outline-2 focus-visible:outline-primary ${number === page ? 'border-primary bg-primary font-bold text-primary-foreground' : 'border-foreground/15 text-foreground/70 hover:text-primary'}`}>{number}</button>)}
          <button type="button" disabled={page >= totalPages} aria-label="Próxima página" onClick={() => onChange({ page: page + 1 })} className="flex size-7 items-center justify-center rounded border border-foreground/15 text-foreground/70 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"><ChevronRight aria-hidden="true" className="size-4" /></button>
        </nav>
      </div>
    </section>
  )
}
