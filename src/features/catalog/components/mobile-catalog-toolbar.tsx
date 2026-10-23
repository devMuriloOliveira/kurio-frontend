import { Search, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'

type MobileCatalogToolbarProps = {
  searchValue?: string
  onSearchSubmit?: (value: string) => void
  onOpenFilters?: () => void
}

export function MobileCatalogToolbar({
  searchValue,
  onSearchSubmit,
  onOpenFilters,
}: MobileCatalogToolbarProps) {
  return (
    <div className="mb-8 flex min-w-0 items-center gap-2 lg:hidden">
      <form role="search" aria-label="Busca do catálogo" className="min-w-0 flex-1" onSubmit={(event) => { event.preventDefault(); onSearchSubmit?.(new FormData(event.currentTarget).get('q')?.toString() ?? '') }}>
      <label className="flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-sidebar px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search aria-hidden="true" className="size-5 shrink-0 text-primary" />
        <input
          type="search"
          name="q"
          defaultValue={searchValue}
          disabled={!onSearchSubmit}
          aria-label="Explorar coleções"
          title="Explorar coleções"
          placeholder="Explorar coleções"
          className="min-w-0 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-primary/80 disabled:cursor-not-allowed"
        />
      </label>
      </form>
      <Button
        type="button"
        size="icon"
        onClick={onOpenFilters}
        disabled={!onOpenFilters}
        aria-label="Abrir filtros"
        title={onOpenFilters ? 'Abrir filtros' : 'Filtros em breve'}
        className="size-[45px] shrink-0 rounded-[14px] disabled:opacity-70"
      >
        <SlidersHorizontal aria-hidden="true" className="size-5" />
      </Button>
    </div>
  )
}
