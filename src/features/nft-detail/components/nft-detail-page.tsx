import { useRef, useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import axios from 'axios'
import { Heart, Mail, Minus, Plus, Star, ZoomIn } from 'lucide-react'

import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { getNft, getNfts } from '@/features/catalog/catalog-api'
import { NFTCard } from '@/features/catalog/components/nft-card'
import { MobileBottomNav } from '@/features/catalog/components/mobile-bottom-nav'
import { addToCart } from '@/features/cart/cart-storage'
import { getAuthToken, subscribeToAuth } from '@/features/auth/auth-api'
import { addFavorite, getFavorites, removeFavorite } from '@/features/catalog/favorites-api'
import type { NFT } from '@/types/nft'

const gallerySlots = [1, 2, 3, 4] as const
const tabs = ['details', 'reviews'] as const
const emeraldRelatedIds = ['cosmic-bloom-118', 'violet-nomad-314', 'ivory-baron-088', 'golden-beat-207', 'golden-signal-160'] as const
const emeraldShortDescription = 'Arte digital de apresentação da coleção Kurio Editions. A compra e os dados de rede são simulados neste desafio.'
const emeraldDetailParagraphs = [
  'Emerald Ape #042 é uma obra digital de apresentação da coleção Kurio Editions. Os atributos, edições e dados de rede desta página são ilustrativos.',
  'O pedido gerado neste desafio é simulado. Ele não registra propriedade em blockchain nem transfere a arte para uma carteira real.',
] as const
type DetailTab = (typeof tabs)[number]

function CatalogLink({ label = 'Mercado' }: { label?: string }) {
  return <Link to="/" hash="catalogo" className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{label}</Link>
}

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const { data: nft, isPending, isError, error, refetch } = useQuery({
    queryKey: ['nfts', nftId],
    queryFn: ({ signal }) => getNft(nftId, signal),
    retry: (count, failure) => !axios.isAxiosError(failure) || failure.response?.status !== 404 ? count < 2 : false,
  })
  const { data: catalog } = useQuery({
    queryKey: ['nfts'],
    queryFn: ({ signal }) => getNfts(signal),
    enabled: Boolean(nft?.collection),
  })

  const notFound = axios.isAxiosError(error) && error.response?.status === 404

  return (
    <main className="min-h-screen bg-background px-6 pt-6 pb-28 text-foreground lg:px-8 lg:pt-8 lg:pb-12">
      <div className="mx-auto max-w-[1200px]">
        <nav aria-label="Caminho da página" className="mb-6 flex flex-wrap gap-2 text-xs text-text-secondary">
          <Link to="/" className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Início</Link>
          <span aria-hidden="true">/</span>
          <CatalogLink />
        </nav>

        {isPending && <p role="status" className="min-h-64 text-text-secondary">Carregando detalhes do NFT...</p>}
        {isError && (
          <section className="min-h-64 space-y-4" role="alert">
            <h1 className="text-xl font-bold">{notFound ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}</h1>
            <p className="text-sm text-text-secondary">{notFound ? 'O item solicitado não está no catálogo.' : 'Verifique a conexão e tente novamente.'}</p>
            {!notFound && <Button type="button" onClick={() => void refetch()}>Tentar novamente</Button>}
            <p><CatalogLink label="Voltar ao catálogo" /></p>
          </section>
        )}
        {nft && <NftDetailContent key={nft.id} nft={nft} catalog={catalog?.data ?? []} />}
      </div>
      <Footer />
      <MobileBottomNav />
    </main>
  )
}

function NftDetailContent({ nft, catalog }: { nft: NFT; catalog: NFT[] }) {
  const queryClient = useQueryClient()
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => null)
  const favoritesKey = ['favorites', token]
  const favoritesQuery = useQuery({ queryKey: favoritesKey, queryFn: () => getFavorites(token!), enabled: Boolean(token), retry: false })
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [favoriteMessage, setFavoriteMessage] = useState<{ token: string | null; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const [cartMessage, setCartMessage] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const available = nft.availableQuantity ?? 0
  const canBuy = available > 0 && Boolean(nft.priceEth)
  const favorite = favoritesQuery.data?.includes(nft.id) ?? false
  const favoriteMutation = useMutation({
    mutationFn: (next: boolean) => next ? addFavorite(token!, nft.id) : removeFavorite(token!, nft.id),
    onMutate: async (next) => {
      setFavoriteMessage(null)
      await queryClient.cancelQueries({ queryKey: favoritesKey })
      const previous = queryClient.getQueryData<string[]>(favoritesKey)
      queryClient.setQueryData<string[]>(favoritesKey, (current = []) => next ? [...current, nft.id] : current.filter((id) => id !== nft.id))
      return { previous }
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(favoritesKey, context?.previous)
      setFavoriteMessage({ token, text: 'Não foi possível salvar o favorito. Tente novamente.' })
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: favoritesKey }),
  })
  const isEmeraldApe = nft.id === 'emerald-ape-042'
  const related = isEmeraldApe
    ? emeraldRelatedIds.flatMap((id) => catalog.filter((item) => item.id === id))
    : nft.collection
      ? catalog.filter((item) => item.id !== nft.id && item.collection === nft.collection).slice(0, 5)
      : []

  function addSelectedToCart() {
    const storedQuantity = addToCart(nft.id, quantity, available)
    setCartMessage(storedQuantity === null
      ? 'Não foi possível salvar o carrinho neste navegador.'
      : `${storedQuantity} ${storedQuantity === 1 ? 'unidade salva' : 'unidades salvas'} no carrinho local. A compra não foi concluída.`)
  }

  function shareNft(network: 'linkedin' | 'email' | 'twitter') {
    const url = encodeURIComponent(window.location.href)
    if (network === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(nft.name)}&body=${url}`
      return
    }
    const destination = network === 'linkedin'
      ? `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
      : `https://x.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${url}`
    window.open(destination, '_blank', 'noopener,noreferrer')
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return

    event.preventDefault()
    setActiveTab(tabs[next])
    tabRefs.current[next]?.focus()
  }

  return (
    <>
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,570px)_minmax(0,1fr)] lg:gap-8">
        <section aria-label={`Galeria de ${nft.name}`} className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[100px_minmax(0,1fr)] lg:gap-7">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col lg:gap-3">
            {nft.imageUrl && gallerySlots.map((slot, index) => (
              <button key={slot} type="button" onClick={() => setSelectedImage(index)} aria-label={`Selecionar visualização ${slot} de ${nft.name}, mesma imagem`} aria-pressed={selectedImage === index} className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:size-[72px] lg:size-[100px] ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}>
                <img src={nft.imageUrl} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative order-1 flex aspect-square min-w-0 items-center justify-center rounded-xl bg-sidebar p-3 sm:order-2 lg:p-4">
            {nft.imageUrl ? (
              <img src={nft.imageUrl} alt={nft.name} className="size-full rounded-xl object-cover" />
            ) : (
              <p className="text-center text-sm text-text-secondary">Imagem não disponível</p>
            )}
            {nft.imageUrl && <Button type="button" variant="secondary" size="icon" aria-label={`Ampliar imagem de ${nft.name}`} onClick={() => dialogRef.current?.showModal()} className="absolute top-4 right-4 lg:top-2 lg:right-2"><ZoomIn aria-hidden="true" /></Button>}
          </div>
        </section>

        <section aria-labelledby="nft-title" className="min-w-0">
          <h1 id="nft-title" className="text-2xl leading-tight font-bold sm:text-3xl">{nft.name}</h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-primary/30 pb-4 lg:mt-2 lg:pb-3">
            <p className="text-xl font-bold text-primary">{nft.priceEth ? `${nft.priceEth} ETH` : 'Preço não informado'}</p>
            {isEmeraldApe && <p className="flex flex-wrap items-center gap-1 text-[11px] text-foreground"><span aria-hidden="true" className="flex text-primary">{Array.from({ length: 5 }, (_, index) => <Star key={index} className="size-3 fill-current" />)}</span><span>19 avaliações de colecionadores <span className="text-text-secondary">(ilustrativo)</span></span></p>}
          </div>

          <h2 className="mt-5 text-sm font-bold lg:mt-4">Sobre este NFT:</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary lg:mt-1.5">{isEmeraldApe ? emeraldShortDescription : nft.description ?? 'Descrição não disponível para este NFT.'}</p>
          <div className="mt-5 space-y-2 text-sm text-text-secondary lg:mt-4 lg:space-y-1">
            {isEmeraldApe ? <div><p className="font-bold text-foreground">Edição:</p><div className="mt-1 flex flex-wrap gap-1">{['1/1', '1/10', '1/50', 'ABERTA'].map((edition) => <span key={edition} title="Opção ilustrativa; não altera a edição" className="rounded-full border border-primary/40 px-2 py-0.5 text-xs transition-colors hover:border-primary hover:text-primary">{edition}</span>)}</div></div> : <p><span className="font-bold text-foreground">Edição:</span> {nft.edition ?? 'Não informada'}</p>}
            {!isEmeraldApe && <p><span className="font-bold text-foreground">Disponibilidade:</span> {nft.availableQuantity === undefined ? 'Não informada' : `${nft.availableQuantity} ${nft.availableQuantity === 1 ? 'unidade disponível' : 'unidades disponíveis'}`}</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-4 lg:justify-between">
            <div role="group" aria-label="Quantidade" className="flex items-center rounded-md border border-primary/50">
              <Button type="button" variant="ghost" size="icon" aria-label="Diminuir quantidade" disabled={quantity <= 1 || !canBuy} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus aria-hidden="true" /></Button>
              <output aria-label="Quantidade selecionada" className="min-w-8 text-center text-sm font-bold">{quantity}</output>
              <Button type="button" variant="ghost" size="icon" aria-label="Aumentar quantidade" disabled={quantity >= available || !canBuy} onClick={() => setQuantity((value) => Math.min(available, value + 1))}><Plus aria-hidden="true" /></Button>
            </div>
            <div className="flex flex-wrap gap-2 lg:ml-auto">
              <Button type="button" disabled={!canBuy} onClick={addSelectedToCart} className="h-auto w-[130px] px-3 py-[10px] font-bold">COMPRAR</Button>
              <Button type="button" variant="outline" aria-pressed={favorite} disabled={Boolean(token) && (favoritesQuery.isPending || favoritesQuery.isError || favoriteMutation.isPending)} onClick={() => { if (!token) setFavoriteMessage({ token: null, text: 'Entre na conta para favoritar.' }); else void favoriteMutation.mutateAsync(!favorite).catch(() => {}) }} className="h-auto w-[130px] gap-2 px-2 py-[10px]"><Heart aria-hidden="true" fill={favorite ? 'currentColor' : 'none'} />{favorite ? 'Favoritado' : 'Favoritar'}</Button>
            </div>
          </div>
          {favoritesQuery.isError && token && <p role="alert" className="mt-2 text-xs text-destructive">Não foi possível carregar seus favoritos. <button type="button" className="underline" onClick={() => void favoritesQuery.refetch()}>Tentar novamente</button></p>}
          {favoriteMessage?.token === token && <p role="alert" className="mt-2 text-xs text-destructive">{favoriteMessage.text}</p>}
          {cartMessage && <p role="status" className="mt-3 text-sm text-primary">{cartMessage}</p>}

          <dl className="mt-6 space-y-2 text-xs text-text-secondary lg:mt-4 lg:space-y-1.5">
            <div className="flex flex-wrap gap-2"><dt>ID do token:</dt><dd className="break-all">{isEmeraldApe ? '#0042' : nft.id}</dd></div>
            <div className="flex flex-wrap gap-2"><dt>Coleção:</dt><dd>{isEmeraldApe ? 'Kurio Apes' : nft.collection ?? 'Não informada'}</dd></div>
            <div className="flex flex-wrap gap-2"><dt>Atributos:</dt><dd>{isEmeraldApe ? 'Óculos, Esmeralda, Raro' : 'Não informados'}</dd></div>
          </dl>
          {isEmeraldApe && <p className="mt-2 text-[10px] text-text-secondary">Dados de apresentação do desafio; sem verificação em blockchain.</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs lg:mt-4">
            <span className="font-bold">Compartilhar este NFT:</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Compartilhar no LinkedIn" onClick={() => shareNft('linkedin')} className="rounded-sm text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/icons/linkedin.svg" alt="" className="size-4" /></button>
              <button type="button" aria-label="Compartilhar por e-mail" onClick={() => shareNft('email')} className="rounded-sm text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Mail aria-hidden="true" className="size-4" /></button>
              <button type="button" aria-label="Compartilhar no Twitter" onClick={() => shareNft('twitter')} className="rounded-sm text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/icons/twitter.svg" alt="" className="size-4" /></button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-16">
        <div role="tablist" aria-label="Informações do NFT" className="flex gap-5 overflow-x-auto border-b border-primary/30 text-xs sm:gap-8 sm:text-sm">
          {tabs.map((tab, index) => <button key={tab} ref={(element) => { tabRefs.current[index] = element }} type="button" role="tab" id={`tab-${tab}`} aria-controls={`panel-${tab}`} aria-selected={activeTab === tab} tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)} onKeyDown={(event) => onTabKeyDown(event, index)} className={`shrink-0 border-b-2 pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeTab === tab ? 'border-primary font-bold text-primary' : 'border-transparent text-foreground'}`}>{tab === 'details' ? 'Detalhes do NFT' : `Avaliações de colecionadores${isEmeraldApe ? ' (19)' : ''}`}</button>)}
        </div>
        <div id="panel-details" role="tabpanel" aria-labelledby="tab-details" tabIndex={0} hidden={activeTab !== 'details'} className="pt-5 text-xs leading-6 text-text-secondary">
          {isEmeraldApe ? <>
            <p>{emeraldDetailParagraphs[0]}</p>
            <p className="mt-5">{emeraldDetailParagraphs[1]}</p>
            <dl className="mt-3 space-y-2">
              <div><dt className="font-bold text-foreground">Rede:</dt><dd>Ethereum, apenas na simulação.</dd></div>
              <div><dt className="font-bold text-foreground">Contrato:</dt><dd>Nenhum contrato inteligente é usado nesta demonstração.</dd></div>
              <div><dt className="font-bold text-foreground">Direitos autorais:</dt><dd>Não aplicáveis à compra simulada.</dd></div>
            </dl>
          </> : <>
            <p>{nft.description ?? 'Descrição não disponível para este NFT.'}</p>
            <dl className="mt-4 space-y-2">
              {nft.collection && <div><dt className="font-bold text-foreground">Coleção:</dt><dd>{nft.collection}</dd></div>}
              {nft.network && <div><dt className="font-bold text-foreground">Rede:</dt><dd>{nft.network}</dd></div>}
              {nft.edition && <div><dt className="font-bold text-foreground">Edição:</dt><dd>{nft.edition}</dd></div>}
              {nft.creator && <div><dt className="font-bold text-foreground">Criador:</dt><dd>{nft.creator}</dd></div>}
            </dl>
          </>}
        </div>
        <div id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews" tabIndex={0} hidden={activeTab !== 'reviews'} className="pt-5 text-sm text-text-secondary">{isEmeraldApe ? 'A contagem de 19 avaliações é ilustrativa. Avaliações reais de colecionadores não estão disponíveis.' : 'Ainda não há avaliações de colecionadores disponíveis para este NFT.'}</div>
      </section>

      <section aria-labelledby="related-title" className="mt-20">
        <h2 id="related-title" className="border-b border-primary/30 pb-3 text-base font-bold text-primary">Mais desta coleção</h2>
        {related.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5 lg:gap-x-[26px]">
            {related.map((item) => <NFTCard key={item.id} nft={item} compact />)}
          </div>
        ) : (
          <p className="mt-5 text-sm text-text-secondary">Nenhum outro NFT desta coleção está disponível no catálogo.</p>
        )}
      </section>

      <dialog ref={dialogRef} aria-label={`Imagem ampliada de ${nft.name}`} className="m-auto max-h-[90dvh] max-w-[min(90vw,720px)] rounded-xl border border-primary/40 bg-sidebar p-4 text-foreground shadow-2xl backdrop:bg-black/80">
        <div className="mb-3 flex items-center justify-between gap-4"><strong className="text-sm">{nft.name}</strong><Button type="button" variant="outline" size="sm" onClick={() => dialogRef.current?.close()}>Fechar</Button></div>
        {nft.imageUrl && <img src={nft.imageUrl} alt={nft.name} className="max-h-[75dvh] w-full rounded-lg object-contain" />}
      </dialog>
    </>
  )
}
