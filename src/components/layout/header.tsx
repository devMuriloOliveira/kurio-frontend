
import { useSyncExternalStore } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthHeaderControl } from '@/features/auth/components/auth-header-control'
import {
  getCartCount,
  subscribeToCart,
} from '@/features/cart/cart-storage'

type HeaderProps = {
  onSearch?: () => void
  onLogin?: () => void
}

export function Header({ onSearch }: HeaderProps) {
  const isMarketPage = useLocation({
    select: (location) =>
      location.pathname.startsWith('/nfts/') ||
      location.pathname === '/carrinho' ||
      location.pathname === '/checkout',
  })

  const cartCount = useSyncExternalStore(
    subscribeToCart,
    getCartCount,
    () => 0,
  )

  return (
    <header className="bg-background text-foreground">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <Link to="/" className="text-xs font-bold tracking-widest focus-visible:outline-2 focus-visible:outline-primary">KURIO</Link>
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onSearch}
              disabled={!onSearch}
              aria-label="Pesquisar"
              title={onSearch ? 'Pesquisar' : 'Pesquisa em breve'}
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
