import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'

type MobileCatalogToolbarProps = {
  onOpenFilters?: () => void
}

export function MobileCatalogToolbar({
  onOpenFilters,
}: MobileCatalogToolbarProps) {
  return (
    <div className="mb-8 flex min-w-0 items-center justify-end gap-2 lg:hidden">
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
