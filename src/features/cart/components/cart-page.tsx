import { useMemo, useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { getCartCoupon, getCartItems, getCartSnapshot, removeFromCart, setCartCoupon, setCartQuantity, subscribeToCart } from '@/features/cart/cart-storage'
import { validateCoupon } from '@/features/cart/order-api'
import { estimatedNetworkFeeEth, formatWeiAsEth, launchDiscountEth, multiplyEth, parseEthToWei, sumWei } from '@/features/cart/eth'
import { getNfts } from '@/features/catalog/catalog-api'
import { MobileBottomNav } from '@/features/catalog/components/mobile-bottom-nav'
import { NFTCard } from '@/features/catalog/components/nft-card'
import type { NFT } from '@/types/nft'

const recommendationFirstPage = ['cosmic-bloom-118', 'violet-nomad-314', 'ivory-baron-088', 'golden-beat-207', 'golden-signal-160'] as const
const networkFeeWei = parseEthToWei(estimatedNetworkFeeEth)
const discountWei = parseEthToWei(launchDiscountEth)

function priceInWei(nft: NFT): bigint | null {
  if (!nft.priceEth) return null
  try {
    return parseEthToWei(nft.priceEth)
  } catch {
    return null
  }
}

function availableStock(nft: NFT): number {
  return Number.isSafeInteger(nft.availableQuantity) && nft.availableQuantity! > 0 ? nft.availableQuantity! : 0
}

export function CartPage() {
  const navigate = useNavigate()
  const snapshot = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => '[]')
  const storedItems = useMemo(() => getCartItems(snapshot), [snapshot])
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['nfts'],
    queryFn: ({ signal }) => getNfts(signal),
  })
  const [promoCode, setPromoCode] = useState(getCartCoupon)
  const [appliedCoupon, setAppliedCoupon] = useState(getCartCoupon)
  const [promoMessage, setPromoMessage] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [recommendationPage, setRecommendationPage] = useState(0)

  const catalog = data?.data ?? []
  const catalogById = new Map(catalog.map((nft) => [nft.id, nft]))
  const lines = storedItems.flatMap((item) => {
    const nft = catalogById.get(item.nftId)
    return nft ? [{ ...item, nft, stock: availableStock(nft), unitWei: priceInWei(nft) }] : []
  })
  const subtotalWei = sumWei(lines.map((line) => line.unitWei === null ? 0n : multiplyEth(line.nft.priceEth!, line.quantity)))
  const canCheckout = lines.length > 0 && lines.length === storedItems.length && lines.every((line) => line.unitWei !== null && line.stock >= line.quantity && line.quantity > 0)
  const appliedNetworkFeeWei = lines.length > 0 ? networkFeeWei : 0n
  const appliedDiscountWei = appliedCoupon ? subtotalWei / 10n : discountWei
  const totalWei = subtotalWei + appliedNetworkFeeWei - appliedDiscountWei

  async function applyPromo() {
    if (!promoCode.trim()) {
      if (setCartCoupon('')) { setAppliedCoupon(''); setPromoMessage('Cupom removido.') }
      return
    }
    try {
      const coupon = await validateCoupon(promoCode.trim())
      if (!setCartCoupon(coupon.code)) throw new Error('Não foi possível salvar o cupom.')
      setAppliedCoupon(coupon.code)
      setPromoMessage(`Cupom ${coupon.code} aplicado.`)
    } catch {
      setPromoMessage('Cupom inválido ou expirado. Nenhum novo desconto foi aplicado.')
    }
  }

  const firstPage = recommendationFirstPage.flatMap((id) => catalog.filter((nft) => nft.id === id))
  const orderedRecommendations = [...firstPage, ...catalog.filter((nft) => !recommendationFirstPage.some((id) => id === nft.id))]
  const visibleRecommendations = Array.from(
    { length: Math.min(5, orderedRecommendations.length) },
    (_, index) => orderedRecommendations[(recommendationPage * 5 + index) % orderedRecommendations.length],
  )

  function changeQuantity(nftId: string, quantity: number, stock: number) {
    if (!setCartQuantity(nftId, quantity, stock)) setCartMessage('Não foi possível atualizar a quantidade neste navegador.')
    else setCartMessage('')
  }

  function deleteItem(nftId: string) {
    if (!removeFromCart(nftId)) setCartMessage('Não foi possível remover o NFT neste navegador.')
    else setCartMessage('NFT removido do carrinho.')
  }

  return (
    <main className="min-h-screen bg-background px-6 pt-6 pb-28 text-foreground lg:px-8 lg:pt-8 lg:pb-12">
      <div className="mx-auto max-w-[1200px]">
        <nav aria-label="Caminho da página" className="mb-8 flex flex-wrap gap-2 text-xs text-text-secondary">
          <Link to="/" className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Início</Link>
          <span aria-hidden="true">/</span>
          <Link to="/" hash="catalogo" className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Mercado</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-bold text-foreground">Carrinho</span>
        </nav>

        {isPending && <p role="status" className="min-h-64 text-text-secondary">Carregando carrinho...</p>}
        {isError && <div role="alert" className="min-h-64 space-y-4"><p>Não foi possível carregar os NFTs do carrinho.</p><Button type="button" onClick={() => void refetch()}>Tentar novamente</Button></div>}

        {data && <>
          <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
            <section aria-label="NFTs no carrinho" className="min-w-0">
              {lines.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-sidebar p-8 text-center">
                <ShoppingCart aria-hidden="true" className="size-10 text-primary" />
                <h1 className="text-lg font-bold">Seu carrinho está vazio</h1>
                <p className="text-sm text-text-secondary">Explore os NFTs e adicione seus favoritos para começar.</p>
                <Button type="button" onClick={() => void navigate({ to: '/', hash: 'catalogo' })}>Explorar NFTs</Button>
              </div> : <>
                <div aria-hidden="true" className="hidden grid-cols-[minmax(0,2fr)_100px_110px_110px_34px] gap-3 border-b border-primary/30 pb-2 text-xs font-bold lg:grid">
                  <span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span className="sr-only">Excluir</span>
                </div>
                <ul className="space-y-2 pt-2">
                  {lines.map((line) => <li key={line.nftId} className="grid min-w-0 grid-cols-2 items-center gap-3 rounded-sm bg-sidebar p-3 lg:grid-cols-[minmax(0,2fr)_100px_110px_110px_34px] lg:px-0 lg:py-2">
                    <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                      <Link to="/nfts/$nftId" params={{ nftId: line.nft.id }} className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        {line.nft.imageUrl ? <img src={line.nft.imageUrl} alt="" className="size-[70px] rounded-md object-cover" /> : <span className="flex size-[70px] items-center justify-center rounded-md bg-background text-[10px]">Sem imagem</span>}
                      </Link>
                      <div className="min-w-0"><Link to="/nfts/$nftId" params={{ nftId: line.nft.id }} className="block truncate text-xs font-bold hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{line.nft.name}</Link><p className="break-all text-[11px] text-text-secondary">ID do item: {line.nft.id}</p></div>
                    </div>
                    <div className="min-w-0 text-xs text-text-secondary"><span className="mb-1 block text-[10px] text-foreground lg:hidden">Preço</span>{line.nft.priceEth ? `${line.nft.priceEth} ETH` : 'Indisponível'}</div>
                    <div><span className="mb-1 block text-[10px] text-foreground lg:hidden">Edições</span><div role="group" aria-label={`Quantidade de ${line.nft.name}`} className="flex items-center gap-2"><button type="button" aria-label={`Diminuir quantidade de ${line.nft.name}`} disabled={line.quantity <= 1} onClick={() => changeQuantity(line.nftId, line.quantity - 1, line.stock)} className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"><Minus aria-hidden="true" className="size-3.5" /></button><output aria-label={`Quantidade de ${line.nft.name}`} className="min-w-4 text-center text-xs">{line.quantity}</output><button type="button" aria-label={`Aumentar quantidade de ${line.nft.name}`} disabled={line.quantity >= line.stock} onClick={() => changeQuantity(line.nftId, line.quantity + 1, line.stock)} className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"><Plus aria-hidden="true" className="size-3.5" /></button></div></div>
                    <div className="text-xs font-bold text-primary"><span className="mb-1 block text-[10px] text-foreground lg:hidden">Total</span>{line.unitWei === null ? 'Indisponível' : `${formatWeiAsEth(multiplyEth(line.nft.priceEth!, line.quantity))} ETH`}</div>
                    <button type="button" aria-label={`Remover ${line.nft.name} do carrinho`} onClick={() => deleteItem(line.nftId)} className="ml-auto flex size-8 items-center justify-center rounded-md text-text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Trash2 aria-hidden="true" className="size-4" /></button>
                  </li>)}
                </ul>
              </>}
              {cartMessage && <p role="status" className="mt-3 text-xs text-text-secondary">{cartMessage}</p>}
              {!canCheckout && storedItems.length > 0 && <p role="alert" className="mt-3 text-xs text-destructive">Preço ou disponibilidade indisponível para um item. Revise o carrinho; os itens foram preservados.</p>}
            </section>

            <aside aria-labelledby="summary-title" className="min-w-0">
              <h2 id="summary-title" className="border-b border-primary/30 pb-2 text-sm font-bold">Resumo da carteira</h2>
              <form className="mt-5" onSubmit={(event) => { event.preventDefault(); void applyPromo() }}>
                <label htmlFor="promo-code" className="mb-2 block text-xs font-bold">Código promocional</label>
                <div className="flex min-w-0"><input id="promo-code" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="Digite o código promocional..." className="min-w-0 flex-1 rounded-l-md bg-primary/10 px-3 py-3 text-[11px] text-foreground placeholder:text-text-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" /><Button type="submit" className="h-auto rounded-l-none rounded-r-md px-3 py-3 font-bold">Aplicar</Button></div>
                {promoMessage && <p role="status" className="mt-2 text-xs text-text-secondary">{promoMessage}</p>}
              </form>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{formatWeiAsEth(subtotalWei)} ETH</dd></div>
                <div className="flex justify-between gap-3"><dt>{appliedCoupon ? `Cupom ${appliedCoupon}` : 'Desconto do lançamento'}</dt><dd>(-) {formatWeiAsEth(appliedDiscountWei)} ETH</dd></div>
                <div className="flex justify-between gap-3"><dt>Taxa de rede</dt><dd>{formatWeiAsEth(appliedNetworkFeeWei)} ETH</dd></div>
              </dl>
              <p className="mt-1 text-right text-[10px] text-text-secondary">{lines.length > 0 ? 'Taxa estimada' : 'Taxa estimada de 0.016 ETH aplicada quando houver itens.'}</p>
              <div className="mt-5 flex justify-between gap-3 text-sm font-bold"><span>Total</span><span className="text-primary">{formatWeiAsEth(totalWei)} ETH</span></div>
              <Button type="button" disabled={!canCheckout} onClick={() => void navigate({ to: '/checkout' })} className="mt-5 h-10 w-full font-bold">Conectar e finalizar</Button>
              <Link to="/" hash="catalogo" className="mt-3 block text-center text-xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Continuar explorando</Link>
            </aside>
          </div>

          <section aria-labelledby="recommendations-title" className="mt-24">
            <h2 id="recommendations-title" className="border-b border-primary/30 pb-3 text-sm font-bold text-primary">Colecionadores também viram</h2>
            {visibleRecommendations.length > 0 ? <>
              <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5 lg:gap-x-[26px]">{visibleRecommendations.map((nft) => <NFTCard key={nft.id} nft={nft} compact />)}</div>
              <div className="mt-4 flex justify-center gap-2" role="group" aria-label="Páginas de recomendações">{[0, 1, 2].map((page) => <button key={page} type="button" aria-label={`Página ${page + 1} de recomendações`} aria-pressed={recommendationPage === page} onClick={() => setRecommendationPage(page)} className={`size-2.5 rounded-full border border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${recommendationPage === page ? 'bg-primary' : 'bg-transparent hover:bg-primary/50'}`} />)}</div>
            </> : <p className="mt-5 text-sm text-text-secondary">Recomendações indisponíveis no momento.</p>}
          </section>
        </>}
      </div>
      <Footer />
      <MobileBottomNav />
    </main>
  )
}
