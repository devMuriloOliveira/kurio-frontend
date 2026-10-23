
import { useState, useSyncExternalStore, type FormEvent, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Search, ShoppingCart, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthHeaderControl } from '@/features/auth/components/auth-header-control'
import {
  getCartCount,
  subscribeToCart,
} from '@/features/cart/cart-storage'

function CatalogSearchForm({ id, query, onSearch, className }: { id: string; query: string; onSearch: (term: string) => void; className: string }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(new FormData(event.currentTarget).get('q')?.toString() ?? '')
  }

  function clear(event: MouseEvent<HTMLButtonElement>) {
    const input = event.currentTarget.form?.querySelector<HTMLInputElement>('input[name="q"]')
    if (input) input.value = ''
    onSearch('')
  }

  return (
    <form id={id} key={query} role="search" aria-label="Pesquisa do catálogo" onSubmit={submit} className={`flex min-w-0 items-center gap-1 rounded-lg bg-sidebar px-2 focus-within:ring-2 focus-within:ring-ring ${className}`}>
      <input name="q" type="search" aria-label="Buscar NFTs ou coleções" defaultValue={query} placeholder="Buscar NFTs ou coleções" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs text-foreground outline-none placeholder:text-text-secondary" />
      <button type="button" onClick={clear} aria-label="Limpar busca" title="Limpar busca" className="flex size-7 shrink-0 items-center justify-center rounded text-text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
        <X aria-hidden="true" className="size-4" />
      </button>
      <Button type="submit" variant="ghost" size="icon" aria-label="Executar busca" title="Buscar no catálogo" className="size-7 shrink-0 text-primary">
        <Search aria-hidden="true" className="size-4" />
      </Button>
    </form>
  )
}

export function Header() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const searchStr = useLocation({ select: (location) => location.searchStr })
  const query = new URLSearchParams(searchStr).get('q') ?? ''
  const navigate = useNavigate({ from: '/' })
  const [searchOpen, setSearchOpen] = useState(Boolean(query))
  const isHomePage = pathname === '/'
  const isMarketPage = useLocation({
    select: (location) =>
      location.pathname.startsWith('/nfts/') ||
      location.pathname === '/carrinho' ||
      location.pathname === '/checkout',
  })

  function commitSearch(term: string) {
    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, q: term.trim() || undefined, page: 1 }),
      hash: 'catalogo',
    })
    setSearchOpen(true)
  }

  const cartCount = useSyncExternalStore(
    subscribeToCart,
    getCartCount,
    () => 0,
  )

  return (
    <header className="bg-background text-foreground">
      <div className="flex items-center gap-2 px-4 py-3 lg:hidden">
        <Link to="/" className="shrink-0 text-xs font-bold tracking-widest focus-visible:outline-2 focus-visible:outline-primary">KURIO</Link>
        {isHomePage && searchOpen && <CatalogSearchForm id="mobile-catalog-search" query={query} onSearch={commitSearch} className="h-10 flex-1" />}
        {isHomePage && <Button type="button" variant="ghost" size="icon" onClick={() => setSearchOpen((open) => !open)} aria-label={searchOpen ? 'Fechar pesquisa' : 'Pesquisar'} aria-expanded={searchOpen} aria-controls="mobile-catalog-search" title="Pesquisar" className="size-9 shrink-0 text-foreground"><Search aria-hidden="true" className="size-5" /></Button>}
        <AuthHeaderControl />
      </div>
      <div className="mx-auto hidden max-w-[1200px] px-6 pt-6 lg:block">
        <div className="grid h-[45px] grid-cols-[1fr_auto_1fr] items-center gap-6">
          <Link
            to="/"
            className="w-fit text-xs font-bold tracking-widest focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            KURIO
          </Link>

          <nav
            aria-label="Navegação principal"
            className="flex h-full items-center gap-10 text-xs"
          >
            <Link
              to="/"
              className={`relative flex h-full items-center font-semibold focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${
                isMarketPage
                  ? 'text-foreground hover:text-primary'
                  : 'text-primary after:absolute after:inset-x-0 after:-bottom-6 after:h-0.5 after:bg-primary'
              }`}
            >
              Início
            </Link>

            <a
              href="/#catalogo"
              className={`relative flex h-full items-center hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${
                isMarketPage
                  ? 'font-semibold text-primary after:absolute after:inset-x-0 after:-bottom-6 after:h-0.5 after:bg-primary'
                  : ''
              }`}
            >
              Mercado
            </a>

            <span
              title="Criadores em breve"
              className="text-foreground/80"
            >
              Criadores
              <span className="sr-only">, em breve</span>
            </span>

            <span
              title="Aprenda em breve"
              className="text-foreground/80"
            >
              Aprenda
              <span className="sr-only">, em breve</span>
            </span>
          </nav>

          <div className="flex items-center justify-end gap-2">
            {isHomePage && searchOpen && <CatalogSearchForm id="desktop-catalog-search" query={query} onSearch={commitSearch} className="h-9 w-[250px]" />}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => isHomePage && setSearchOpen((open) => !open)}
              disabled={!isHomePage}
              aria-label={searchOpen && isHomePage ? 'Fechar pesquisa' : 'Pesquisar'}
              aria-expanded={isHomePage ? searchOpen : undefined}
              aria-controls={isHomePage ? 'desktop-catalog-search' : undefined}
              title={isHomePage ? 'Pesquisar' : 'Pesquisa no catálogo inicial'}
              className="text-foreground disabled:opacity-70"
            >
              <Search aria-hidden="true" />
            </Button>

            <div className="relative">
              <Link
                to="/carrinho"
                aria-label="Carrinho"
                title="Carrinho"
                className="flex size-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <ShoppingCart
                  aria-hidden="true"
                  className="size-4"
                />
              </Link>

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Login, cadastro, usuário logado e logout */}
            <AuthHeaderControl />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mt-6 border-t border-border"
        />
      </div>
    </header>
  )
}
