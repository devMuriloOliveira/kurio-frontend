import type { CheckoutNetwork, WalletType } from '@/features/cart/checkout-validation'

export type DemoOrderItem = {
  nftId: string
  name: string
  imageUrl?: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
}

export type DemoOrder = {
  id: string
  status: 'Pedido demonstrativo'
  createdAt: string
  items: DemoOrderItem[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  network: CheckoutNetwork
  walletType: WalletType
}

const orderKey = (id: string) => `kurio-demo-order-v1:${id}`

export function saveDemoOrder(order: DemoOrder): boolean {
  try {
    localStorage.setItem(orderKey(order.id), JSON.stringify(order))
    return true
  } catch {
    return false
  }
}

export function deleteDemoOrder(id: string): void {
  try { localStorage.removeItem(orderKey(id)) } catch { /* storage may be unavailable */ }
}

export function getDemoOrder(id: string): DemoOrder | null {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  try {
    const value: unknown = JSON.parse(localStorage.getItem(orderKey(id)) ?? 'null')
    if (!value || typeof value !== 'object') return null
    const order = value as Partial<DemoOrder>
    if (order.id !== id || order.status !== 'Pedido demonstrativo' || !Array.isArray(order.items) || order.items.length === 0 ||
      !order.items.every((item) => typeof item.nftId === 'string' && typeof item.name === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0 && typeof item.lineTotalEth === 'string') ||
      !['ethereum', 'polygon', 'solana'].includes(order.network ?? '') || !['metamask', 'walletconnect', 'coinbase'].includes(order.walletType ?? '') ||
      typeof order.createdAt !== 'string' || typeof order.subtotalEth !== 'string' || typeof order.discountEth !== 'string' || typeof order.networkFeeEth !== 'string' || typeof order.totalEth !== 'string') return null
    return order as DemoOrder
  } catch {
    return null
  }
}
