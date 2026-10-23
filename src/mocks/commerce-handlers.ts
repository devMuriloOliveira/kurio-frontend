import { delay, http, HttpResponse } from 'msw'
import { initialNfts } from './data/nfts'
import { userIdFromRequest } from './auth-handlers'
import { emitNftUpdated, emitOrderUpdated } from './realtime'
import { estimatedNetworkFeeEth, formatWeiAsEth, multiplyEth, parseEthToWei, sumWei } from '@/features/cart/eth'
import type { Quote, Order } from '@/features/cart/order-api'
import type { CartItem } from '@/features/cart/cart-storage'
import type { CollectorWallet } from '@/features/profile/profile-api'
import type { NFT } from '@/types/nft'

type StoredQuote = Quote & { userId: string }
type StoredOrder = Order & { userId: string; idempotencyKey: string; quoteId: string; version?: number; resolvesTo?: 'confirmed' | 'declined'; readyAt?: number }

const CATALOG_KEY = 'kurio-demo-catalog-v1'
const QUOTES_KEY = 'kurio-demo-quotes-v1'
const ORDERS_KEY = 'kurio-demo-orders-v1'
const WALLETS_KEY = 'kurio-demo-wallets-v1'
const OUTCOME_KEY = 'kurio-demo-order-outcome-v1'
const TIMEOUT_KEY = 'kurio-demo-order-timeout-once-v1'
const FEE_KEY = 'kurio-demo-network-fee-eth-v1'
const EXPIRED_COUPON_KEY = 'kurio-demo-coupon-expired-v1'

function couponDiscount(code: string | null): number | null {
  if (!code) return 0
  return code === 'DEMO10' && sessionStorage.getItem(EXPIRED_COUPON_KEY) !== '1' ? 1000 : null
}

function resolvePendingOrder(orderId: string): StoredOrder | undefined {
  const orders = load<StoredOrder>(ORDERS_KEY)
  const order = orders.find((item) => item.id === orderId)
  if (order?.status !== 'pending' || !order.resolvesTo || Date.now() < (order.readyAt ?? 0)) return order
  const catalog = catalogSnapshot()
  const purchased = new Map(order.items.map((item) => [item.nftId, item.quantity]))
  const fresh = quoteFor(order.userId, order.items.map(({ nftId, quantity }) => ({ nftId, quantity })), order.walletId, order.couponCode)
  const canConfirm = order.resolvesTo === 'confirmed' && fresh?.totalEth === order.totalEth && fresh.items.every((line, index) => line.unitPriceEth === order.items[index].unitPriceEth) && catalog.every((nft) => !purchased.has(nft.id) || (nft.availableQuantity ?? 0) >= purchased.get(nft.id)!)
  const nextCatalog = canConfirm ? catalog.map((nft) => purchased.has(nft.id) ? { ...nft, availableQuantity: nft.availableQuantity! - purchased.get(nft.id)!, version: (nft.version ?? 1) + 1 } : nft) : catalog
  if (canConfirm) save(CATALOG_KEY, nextCatalog)
  order.status = canConfirm ? 'confirmed' : 'declined'
  order.transactionId = canConfirm ? `sim-${crypto.randomUUID()}` : null
  order.version = (order.version ?? 1) + 1
  save(ORDERS_KEY, orders)
  if (canConfirm) nextCatalog.filter((nft) => purchased.has(nft.id)).forEach(emitNftUpdated)
  emitOrderUpdated(order)
  return order
}

function load<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value as T[] : []
  } catch { return [] }
}

function save<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function catalogSnapshot(): NFT[] {
  const stored = load<NFT>(CATALOG_KEY)
  return stored.length ? stored : initialNfts
}

function error(message: string, status: number) {
  return HttpResponse.json({ message }, { status })
}

function quoteFor(userId: string, items: CartItem[], walletId: string, couponCode: string | null): Quote | null {
  const wallet = load<CollectorWallet>(WALLETS_KEY).find((item) => item.id === walletId && item.userId === userId)
  if (!wallet || !Array.isArray(items) || items.length === 0) return null
  const discountBps = couponDiscount(couponCode)
  if (discountBps === null) return null
  const seen = new Set<string>()
  const catalog = new Map(catalogSnapshot().map((nft) => [nft.id, nft]))
  const lines: Quote['items'] = []
  for (const item of items) {
    if (!item || typeof item.nftId !== 'string' || seen.has(item.nftId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1) return null
    seen.add(item.nftId)
    const nft = catalog.get(item.nftId)
    if (!nft?.priceEth || nft.network !== wallet.network || !Number.isSafeInteger(nft.availableQuantity) || item.quantity > nft.availableQuantity!) return null
    try {
      lines.push({ nftId: nft.id, name: nft.name, imageUrl: nft.imageUrl, quantity: item.quantity, unitPriceEth: nft.priceEth, lineTotalEth: formatWeiAsEth(multiplyEth(nft.priceEth, item.quantity)), availableQuantity: nft.availableQuantity! })
    } catch { return null }
  }
  const subtotal = sumWei(lines.map((line) => parseEthToWei(line.lineTotalEth)))
  let fee: bigint
  try { fee = parseEthToWei(sessionStorage.getItem(FEE_KEY) ?? estimatedNetworkFeeEth) } catch { return null }
  const discount = subtotal * BigInt(discountBps) / 10_000n
  return {
    id: crypto.randomUUID(), walletId: wallet.id, network: wallet.network, walletType: wallet.type,
    items: lines, couponCode, subtotalEth: formatWeiAsEth(subtotal), discountEth: formatWeiAsEth(discount),
    networkFeeEth: formatWeiAsEth(fee), totalEth: formatWeiAsEth(subtotal + fee - discount),
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  }
}

export const commerceHandlers = [
  http.post('/api/demo/nfts/:id', async ({ request, params }) => {
    if (!userIdFromRequest(request)) return error('Sessão inválida ou expirada.', 401)
    const body: unknown = await request.json()
    const priceEth = body && typeof body === 'object' && 'priceEth' in body ? body.priceEth : null
    const availableQuantity = body && typeof body === 'object' && 'availableQuantity' in body ? body.availableQuantity : null
    if (typeof priceEth !== 'string' || !Number.isSafeInteger(availableQuantity) || (availableQuantity as number) < 0) return error('Atualização inválida.', 422)
    try { parseEthToWei(priceEth) } catch { return error('Preço inválido.', 422) }
    const catalog = catalogSnapshot()
    const current = catalog.find((nft) => nft.id === params.id)
    if (!current) return error('NFT não encontrado.', 404)
    const updated = { ...current, priceEth, availableQuantity: availableQuantity as number, version: (current.version ?? 1) + 1 }
    save(CATALOG_KEY, catalog.map((nft) => nft.id === updated.id ? updated : nft))
    emitNftUpdated(updated)
    return HttpResponse.json({ data: updated })
  }),
  http.post('/api/coupons/validate', async ({ request }) => {
    const body: unknown = await request.json()
    const code = body && typeof body === 'object' && 'code' in body && typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    const discountBps = couponDiscount(code)
    return code && discountBps !== null ? HttpResponse.json({ data: { code, discountBps } }) : error('Cupom inválido ou expirado.', 422)
  }),
  http.post('/api/quotes', async ({ request }) => {
    const userId = userIdFromRequest(request)
    if (!userId) return error('Sessão inválida ou expirada.', 401)
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('items' in body) || !('walletId' in body) || typeof body.walletId !== 'string') return error('Cotação inválida.', 422)
    const couponCode = 'couponCode' in body && typeof body.couponCode === 'string' ? body.couponCode : null
    const quote = quoteFor(userId, body.items as CartItem[], body.walletId, couponCode)
    if (!quote) return error('Carteira, preço ou disponibilidade incompatível. Revise o carrinho.', 409)
    save(QUOTES_KEY, [...load<StoredQuote>(QUOTES_KEY), { ...quote, userId }])
    return HttpResponse.json({ data: quote })
  }),
  http.post('/api/orders', async ({ request }) => {
    const userId = userIdFromRequest(request)
    if (!userId) return error('Sessão inválida ou expirada.', 401)
    const key = request.headers.get('Idempotency-Key')
    const body: unknown = await request.json()
    if (!key || key.length > 100 || !body || typeof body !== 'object' || !('quoteId' in body) || typeof body.quoteId !== 'string') return error('Pedido inválido.', 422)
    const previous = load<StoredOrder>(ORDERS_KEY).find((order) => order.userId === userId && order.idempotencyKey === key)
    if (previous) return previous.quoteId === body.quoteId ? HttpResponse.json({ data: previous }) : error('Chave de idempotência usada com outro pedido.', 409)
    if (load<StoredOrder>(ORDERS_KEY).some((order) => order.userId === userId && order.quoteId === body.quoteId)) return error('Cotação já utilizada. Recupere o pedido original.', 409)
    const quote = load<StoredQuote>(QUOTES_KEY).find((item) => item.id === body.quoteId && item.userId === userId)
    if (!quote || Date.parse(quote.expiresAt) < Date.now()) return error('Cotação expirada. Revise os valores.', 409)
    const fresh = quoteFor(userId, quote.items.map(({ nftId, quantity }) => ({ nftId, quantity })), quote.walletId, quote.couponCode)
    if (!fresh || fresh.totalEth !== quote.totalEth || fresh.items.some((line, index) => line.unitPriceEth !== quote.items[index].unitPriceEth || line.availableQuantity !== quote.items[index].availableQuantity)) return error('Preço, estoque, cupom ou taxa mudou. Revise a compra.', 409)
    const outcome = sessionStorage.getItem(OUTCOME_KEY)
    const status = outcome === 'declined' ? 'declined' : outcome === 'pending-confirmed' || outcome === 'pending-declined' ? 'pending' : 'confirmed'
    const order: StoredOrder = {
      id: crypto.randomUUID(), userId, idempotencyKey: key, quoteId: quote.id,
      walletId: quote.walletId, network: quote.network, walletType: quote.walletType,
      items: quote.items, couponCode: quote.couponCode, subtotalEth: quote.subtotalEth, discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth, totalEth: quote.totalEth,
      status, version: 1, createdAt: new Date().toISOString(), transactionId: status === 'confirmed' ? `sim-${crypto.randomUUID()}` : null,
      resolvesTo: outcome === 'pending-confirmed' ? 'confirmed' : outcome === 'pending-declined' ? 'declined' : undefined,
      readyAt: status === 'pending' ? Date.now() + 700 : undefined,
    }
    const purchased = new Map(order.items.map((item) => [item.nftId, item.quantity]))
    const previousCatalog = catalogSnapshot()
    const nextCatalog = previousCatalog.map((nft) => status === 'confirmed' && purchased.has(nft.id) ? { ...nft, availableQuantity: nft.availableQuantity! - purchased.get(nft.id)!, version: (nft.version ?? 1) + 1 } : nft)
    try {
      save(CATALOG_KEY, nextCatalog)
      save(ORDERS_KEY, [...load<StoredOrder>(ORDERS_KEY), order])
    } catch {
      try { save(CATALOG_KEY, previousCatalog) } catch { /* armazenamento indisponível */ }
      return error('Não foi possível persistir o pedido simulado. Tente novamente.', 503)
    }
    if (status === 'confirmed') nextCatalog.filter((nft) => purchased.has(nft.id)).forEach(emitNftUpdated)
    emitOrderUpdated(order)
    if (status === 'pending') window.setTimeout(() => resolvePendingOrder(order.id), 750)
    if (sessionStorage.getItem(TIMEOUT_KEY) === '1') {
      sessionStorage.removeItem(TIMEOUT_KEY)
      await delay(10_500)
    }
    return HttpResponse.json({ data: order }, { status: 201 })
  }),
  http.get('/api/orders/:id', ({ request, params }) => {
    const userId = userIdFromRequest(request)
    if (!userId) return error('Sessão inválida ou expirada.', 401)
    const existing = load<StoredOrder>(ORDERS_KEY).find((item) => item.id === params.id && item.userId === userId)
    return existing ? HttpResponse.json({ data: resolvePendingOrder(existing.id) }) : error('Pedido não encontrado.', 404)
  }),
]
