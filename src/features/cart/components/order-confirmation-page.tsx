import { Link, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import { X } from 'lucide-react'

import { fetchOrder } from '@/features/cart/order-api'
import { applyConfirmedOrderToCart } from '@/features/cart/cart-storage'
import { getAuthToken, subscribeToAuth } from '@/features/auth/auth-api'

const networkNames = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const walletNames = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

const backToCatalog = {
  to: '/' as const,
  hash: 'catalogo',
}

export function OrderConfirmationPage() {
  const queryClient = useQueryClient()
  const { orderId } = useParams({ from: '/pedido/$orderId' })
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => null)
  const { data: order, isPending, isError, refetch } = useQuery({
    queryKey: ['orders', token, orderId], queryFn: () => fetchOrder(orderId), enabled: Boolean(token), retry: false,
  })

  useEffect(() => {
    if (order?.status === 'confirmed') {
      if (applyConfirmedOrderToCart(order.id, order.items.map(({ nftId, quantity }) => ({ nftId, quantity })))) {
        void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      }
    }
  }, [order, queryClient])

  const date = order
    ? new Date(order.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <main className="fixed inset-0 z-50 flex min-h-dvh items-start justify-center overflow-y-auto bg-background px-4 py-8 text-foreground sm:items-center sm:py-12">
      <section
        aria-labelledby="confirmation-title"
        className="relative my-auto w-full max-w-[480px] overflow-hidden bg-sidebar shadow-2xl shadow-black/30"
      >
        <Link
          {...backToCatalog}
          aria-label="Fechar e voltar ao marketplace"
          className="absolute right-4 top-4 z-10 rounded-sm p-1 text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X aria-hidden="true" className="size-4" />
        </Link>

        {!token ? <div className="px-6 py-12 text-center"><h1 id="confirmation-title" className="text-lg font-bold">Acesso restrito</h1><p className="mt-3 text-xs text-text-secondary">Entre na sua conta para consultar o pedido.</p></div> : isPending ? <p role="status" className="px-6 py-12 text-center text-sm">Carregando pedido...</p> : order?.status === 'confirmed' ? (
          <>
            <header className="px-5 pb-4 pt-6 text-center sm:px-7">
              <img
                src="/images/thank-you.png"
                alt="Obrigado pela compra"
                className="mx-auto h-16 w-16 object-contain"
              />              
              <h1 id="confirmation-title" className="text-sm font-bold">Pedido confirmado na simulação</h1>
              <p className="mt-2 text-xs text-text-secondary">
                Compra simulada concluída. Nenhum NFT foi transferido em blockchain.
              </p>
            </header>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-y border-primary/50 bg-primary/5 px-5 py-3 text-[11px] sm:grid-cols-4 sm:px-7">
              <div className="min-w-0">
                <dt className="text-foreground">ID da transação</dt>
                <dd title={order.transactionId ?? order.id} className="mt-1 truncate text-text-secondary">{order.transactionId ?? order.id}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-foreground">Data</dt>
                <dd className="mt-1 text-text-secondary">{date}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-foreground">Total</dt>
                <dd className="mt-1 font-bold text-primary">{order.totalEth} ETH</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-foreground">Carteira</dt>
                <dd className="mt-1 text-text-secondary">{walletNames[order.walletType]}</dd>
              </div>
            </dl>

            <div className="px-5 pb-7 pt-5 sm:px-7">
              <h2 className="mb-3 text-xs font-bold">Detalhes do pedido</h2>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 border-b border-primary/25 pb-2 text-[11px] font-bold">
                <span>NFTs</span>
                <span>Edições</span>
                <span className="text-right">Subtotal</span>
              </div>

              <ul className="mt-2 space-y-3">
                {order.items.map((item) => (
                  <li key={item.nftId} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-[11px]">
                    <div className="flex min-w-0 items-center gap-2">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span aria-hidden="true" className="size-12 shrink-0 rounded-md bg-background" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold" title={item.name}>{item.name}</p>
                        <p className="truncate text-text-secondary" title={item.nftId}>ID: {item.nftId}</p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-text-secondary">(× {item.quantity})</span>
                    <span className="whitespace-nowrap text-right font-bold text-primary">{item.lineTotalEth} ETH</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-b border-primary/35 pb-4 text-xs">
                <div className="flex justify-between gap-3">
                  <dt>Subtotal</dt>
                  <dd>{order.subtotalEth} ETH</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Desconto do lançamento</dt>
                  <dd>(-) {order.discountEth} ETH</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Taxa de rede estimada</dt>
                  <dd>{order.networkFeeEth} ETH</dd>
                </div>
                <div className="flex justify-between gap-3 font-bold">
                  <dt>Total</dt>
                  <dd className="text-primary">{order.totalEth} ETH</dd>
                </div>
              </dl>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-text-secondary">
                Pedido confirmado apenas na API simulada. Rede selecionada: {networkNames[order.network]}. Nenhuma carteira real foi conectada.
              </p>
              <div className="mt-4 flex justify-center">
                <Link
                  {...backToCatalog}
                  className="inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Voltar ao marketplace
                </Link>
              </div>
            </div>
          </>
        ) : order ? <div className="px-6 py-12 text-center"><h1 id="confirmation-title" className="text-lg font-bold">{order.status === 'pending' ? 'Pedido pendente' : 'Pagamento recusado'}</h1><p className="mt-3 text-xs text-text-secondary">Estado recebido da API simulada. Seus itens permanecem no carrinho.</p><button type="button" onClick={() => void refetch()} className="mt-4 text-xs text-primary underline">Atualizar estado</button></div> : (
          <div className="px-6 py-12 text-center">
            <h1 id="confirmation-title" className="text-lg font-bold">Pedido não encontrado</h1>
            <p className="mt-3 text-xs text-text-secondary">
              {isError ? 'O pedido não existe para esta conta ou não foi possível consultar a API.' : 'Nenhum pedido encontrado.'}
            </p>
            <Link
              {...backToCatalog}
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Voltar ao marketplace
            </Link>
          </div>
        )}
        <div aria-hidden="true" className="h-2 bg-primary" />
      </section>
    </main>
  )
}
