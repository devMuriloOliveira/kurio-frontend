import { useSyncExternalStore } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Heart, House, ShoppingCart, UserRound } from 'lucide-react'

import { getCartCount, subscribeToCart } from '@/features/cart/cart-storage'

export function MobileBottomNav() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const isHome = pathname === '/'
  const isCart = pathname === '/carrinho'
  const cartCount = useSyncExternalStore(subscribeToCart, getCartCount, () => 0)

  return (
    <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground/10 bg-background/95 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex h-16 max-w-[600px] items-center justify-around px-6">
        <Link to="/" aria-current={isHome ? 'page' : undefined} className={`flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isHome ? 'text-primary' : 'text-foreground/70'}`} title="Início" aria-label="Início">
          <House aria-hidden="true" className="size-5" />
        </Link>
        <button type="button" disabled aria-label="Favoritos indisponíveis" title="Favoritos em breve" className="flex size-11 items-center justify-center text-foreground/70 disabled:cursor-not-allowed">
          <Heart aria-hidden="true" className="size-5" />
        </button>
        <Link to="/carrinho" aria-current={isCart ? 'page' : undefined} aria-label="Carrinho" title="Carrinho" className={`relative flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isCart ? 'text-primary' : 'text-foreground/70'}`}>
          <ShoppingCart aria-hidden="true" className="size-5" />
          {cartCount > 0 && <span className="absolute top-0 right-0 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{cartCount}</span>}
        </Link>
        <Link to="/perfil" aria-current={pathname === '/perfil' ? 'page' : undefined} aria-label="Perfil" title="Perfil" className={`flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${pathname === '/perfil' ? 'text-primary' : 'text-foreground/70'}`}>
          <UserRound aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </nav>
  )
}
