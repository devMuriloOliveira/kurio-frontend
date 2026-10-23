import { ChevronRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { NFTCard } from '@/features/catalog/components/nft-card'
import type { CatalogSearch, NftsResponse } from '@/features/catalog/catalog-api'
import type { NFT } from '@/types/nft'

type ChangeSearch = (patch: Partial<CatalogSearch>) => void
type Facets = NftsResponse['facets']
type PriceBounds = { min: number; max: number }
type FilterProps = { facets?: Facets; priceBounds?: PriceBounds; search: CatalogSearch; onChange: ChangeSearch }
const networkLabels: Record<string, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const categoryOptions = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis', 'Generativa', 'Jogos', 'Assinaturas', 'Utilidade']
const networkOptions = ['ethereum', 'polygon', 'solana'] as const

function PriceRangeFilter({ bounds, search, onChange }: { bounds?: PriceBounds; search: CatalogSearch; onChange: ChangeSearch }) {
  const minBound = bounds?.min ?? 0
  const maxBound = bounds?.max ?? 0
  const clamp = (value: number) => Math.max(minBound, Math.min(maxBound, value))
  const requestedMin = search.minPrice ? Number(search.minPrice) : minBound
  const requestedMax = search.maxPrice ? Number(search.maxPrice) : maxBound
  const initialMin = bounds && Number.isFinite(requestedMin) ? clamp(requestedMin) : minBound
  const initialMax = bounds && Number.isFinite(requestedMax) ? Math.max(initialMin, clamp(requestedMax)) : maxBound
  const [minValue, setMinValue] = useState(initialMin)
  const [maxValue, setMaxValue] = useState(initialMax)
  const span = maxBound - minBound
  const leftPercent = span > 0 ? ((minValue - minBound) / span) * 100 : 0
  const rightPercent = span > 0 ? ((maxValue - minBound) / span) * 100 : 100
  const formatPrice = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onChange({
      minPrice: minValue > minBound ? minValue.toFixed(2) : undefined,
      maxPrice: maxValue < maxBound ? maxValue.toFixed(2) : undefined,
    })
  }

  if (!bounds) return <p className="mt-3 text-text-secondary" role="status">Carregando preços...</p>

  return (
    <form key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}-${minBound}-${maxBound}`} className="mt-2" onSubmit={applyRange}>
      <div className="relative h-5 px-1" aria-label="Selecionar faixa de preço">
        <div className="absolute top-1/2 right-1 left-1 h-0.5 -translate-y-1/2 rounded bg-primary/30" />
        <div className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded bg-primary" style={{ left: `calc(${leftPercent}% + 4px)`, width: `calc(${rightPercent - leftPercent}% - 8px)` }} />
        <input
          type="range"
          aria-label="Preço mínimo"
          min={minBound}
          max={maxValue}
          step="0.01"
          value={minValue}
          disabled={span <= 0}
          onChange={(event) => setMinValue(Number(event.currentTarget.value))}
          className="pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:ring-2 [&::-moz-range-thumb]:ring-background [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-0.5 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-background disabled:opacity-50"
          style={{ zIndex: minValue > minBound + span * 0.8 ? 5 : 3 }}
        />
        <input
          type="range"
          aria-label="Preço máximo"
          min={minValue}
          max={maxBound}
          step="0.01"
          value={maxValue}
          disabled={span <= 0}
          onChange={(event) => setMaxValue(Number(event.currentTarget.value))}
          className="pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:ring-2 [&::-moz-range-thumb]:ring-background [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-0.5 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-background disabled:opacity-50"
          style={{ zIndex: maxValue < maxBound - span * 0.2 ? 5 : 4 }}
        />
      </div>
      <p className="mt-1 text-[10px] text-text-secondary">Preço: {formatPrice.format(minValue)} – {formatPrice.format(maxValue)} ETH</p>
      <button type="submit" className="mt-2 rounded bg-primary px-2.5 py-1 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Aplicar</button>
    </form>
  )
}

export function FilterSidebar({ facets, priceBounds, search, onChange }: FilterProps) {
  const categoryCounts = facets?.categories ?? []
  const categories = [
    ...categoryOptions.map((value) => ({ value, count: categoryCounts.find((item) => item.value === value)?.count ?? 0 })),
    ...categoryCounts.filter((item) => !categoryOptions.includes(item.value)),
  ]
  const networkCounts = facets?.networks ?? []
  const networks = [
    ...networkOptions.map((value) => ({ value, count: networkCounts.find((item) => item.value === value)?.count ?? 0 })),
    ...networkCounts.filter((item) => !networkOptions.includes(item.value as typeof networkOptions[number])),
  ]

  return (
    <aside aria-label="Filtros do catálogo" className="space-y-4">
      <div className="bg-sidebar px-4 py-5 text-[11px]">
        <h2 className="font-bold text-foreground">Coleções</h2>
        <ul className="mt-3 space-y-2.5 text-text-secondary">
          {categories.map(({ value, count }) => <li key={value}>
            <button type="button" aria-pressed={search.category === value} onClick={() => onChange({ category: search.category === value ? undefined : value })} className="flex w-full justify-between gap-3 rounded-sm pl-2 text-left transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:text-primary">
              <span>{value}</span><span>({count})</span>
            </button>
          </li>)}
        </ul>

        <h2 className="mt-7 font-bold text-foreground">Faixa de preço</h2>
        <PriceRangeFilter key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}-${priceBounds?.min ?? ''}-${priceBounds?.max ?? ''}`} bounds={priceBounds} search={search} onChange={onChange} />

        <h2 className="mt-7 font-bold text-foreground">Rede</h2>
        <ul className="mt-3 space-y-2.5 text-text-secondary">
          {networks.map(({ value, count }) => <li key={value}>
            <button type="button" aria-pressed={search.network === value} onClick={() => onChange({ network: search.network === value ? undefined : value })} className="flex w-full justify-between gap-3 rounded-sm pl-2 text-left transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:text-primary">
              <span>{networkLabels[value] ?? value}</span><span>({count})</span>
            </button>
          </li>)}
        </ul>
        {(search.q || search.category || search.network || search.minPrice || search.maxPrice) && <button type="button" onClick={() => onChange({ q: undefined, category: undefined, network: undefined, minPrice: undefined, maxPrice: undefined })} className="mt-5 text-primary underline focus-visible:outline-2 focus-visible:outline-primary">Limpar filtros</button>}
      </div>

      <div className="overflow-hidden rounded-xl bg-sidebar pt-4">
        <h2 className="px-4 text-sm font-bold text-primary">NFT EM DESTAQUE</h2>
        <p className="mt-1 px-4 text-xs font-bold text-foreground">OFERTA LIMITADA</p>
        <img src="/images/sage-nomad.png" alt="Sage Nomad, NFT em destaque" loading="lazy" className="mt-3 aspect-square w-full rounded-xl object-cover" />
      </div>
    </aside>
  )
}

type CatalogSectionProps = FilterProps & { nfts: NFT[]; total: number; totalPages: number }

export function CatalogSection({ nfts, total, totalPages, facets, priceBounds, search, onChange }: CatalogSectionProps) {
  const page = search.page ?? 1
  return (
    <section aria-label="Catálogo de NFTs" className="mx-auto max-w-[1200px] lg:grid lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
      <div className="hidden lg:block"><FilterSidebar facets={facets} priceBounds={priceBounds} search={search} onChange={onChange} /></div>
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
