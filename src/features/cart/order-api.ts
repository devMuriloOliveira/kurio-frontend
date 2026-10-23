import { api } from '@/lib/api'
import { getAuthToken } from '@/features/auth/auth-api'
import type { CartItem } from './cart-storage'
import type { CheckoutNetwork, WalletType } from './checkout-validation'

export type OrderLine = {
  nftId: string
  name: string
  imageUrl?: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
  availableQuantity: number
}

export type Quote = {
  id: string
  walletId: string
  network: CheckoutNetwork
  walletType: WalletType
  items: OrderLine[]
  couponCode: string | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  expiresAt: string
}

export type Order = Omit<Quote, 'expiresAt'> & {
  status: 'confirmed' | 'pending' | 'declined'
  createdAt: string
  transactionId: string | null
}

export type Coupon = { code: string; discountBps: number }

function authHeaders() {
  const token = getAuthToken()
  if (!token) throw new Error('Faça login para continuar.')
  return { Authorization: `Bearer ${token}` }
}

export async function validateCoupon(code: string): Promise<Coupon> {
  const response = await api.post<{ data: Coupon }>('/coupons/validate', { code })
  return response.data.data
}

export async function requestQuote(items: CartItem[], walletId: string, couponCode: string | null): Promise<Quote> {
  const response = await api.post<{ data: Quote }>('/quotes', { items, walletId, couponCode }, { headers: authHeaders() })
  return response.data.data
}

export async function createOrder(quoteId: string, key: string): Promise<Order> {
  const response = await api.post<{ data: Order }>('/orders', { quoteId }, {
    headers: { ...authHeaders(), 'Idempotency-Key': key },
  })
  return response.data.data
}

export async function fetchOrder(id: string): Promise<Order> {
  const response = await api.get<{ data: Order }>(`/orders/${encodeURIComponent(id)}`, { headers: authHeaders() })
  return response.data.data
}
