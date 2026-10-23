export type CartItem = {
  nftId: string
  quantity: number
}

const storageKey = 'kurio-cart-v1'
const couponKey = 'kurio-cart-coupon-v1'
const appliedOrdersKey = 'kurio-cart-applied-orders-v1'
const cartChangedEvent = 'kurio-cart-changed'

export function getCartCoupon(): string {
  try { return localStorage.getItem(couponKey) ?? '' } catch { return '' }
}

export function setCartCoupon(code: string): boolean {
  try {
    if (code) localStorage.setItem(couponKey, code)
    else localStorage.removeItem(couponKey)
    window.dispatchEvent(new Event(cartChangedEvent))
    return true
  } catch { return false }
}

export function getCartSnapshot(): string {
  try {
    return localStorage.getItem(storageKey) ?? '[]'
  } catch {
    return '[]'
  }
}

export function getCartItems(snapshot = getCartSnapshot()): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(snapshot)
    if (!Array.isArray(parsed)) return []

    const valid = parsed.filter((item): item is CartItem =>
      typeof item === 'object' && item !== null &&
      typeof item.nftId === 'string' && item.nftId.length > 0 &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0,
    )
    const quantities = new Map<string, number>()
    for (const item of valid) {
      quantities.set(item.nftId, Math.min(Number.MAX_SAFE_INTEGER, (quantities.get(item.nftId) ?? 0) + item.quantity))
    }
    return Array.from(quantities, ([nftId, quantity]) => ({ nftId, quantity }))
  } catch {
    return []
  }
}

export function getCartCount(): number {
  return getCartItems().reduce((count, item) => Math.min(Number.MAX_SAFE_INTEGER, count + item.quantity), 0)
}

export function subscribeToCart(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === couponKey) onChange()
  }
  window.addEventListener(cartChangedEvent, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(cartChangedEvent, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function replaceCartItems(items: CartItem[]): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items))
    window.dispatchEvent(new Event(cartChangedEvent))
    return true
  } catch {
    return false
  }
}

export function addToCart(nftId: string, quantity: number, availableQuantity: number): number | null {
  if (!nftId || !Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(availableQuantity) || availableQuantity < 1) {
    return null
  }

  const items = getCartItems()
  const existing = items.find((item) => item.nftId === nftId)
  const total = Math.min((existing?.quantity ?? 0) + quantity, availableQuantity)
  const next = existing
    ? items.map((item) => item.nftId === nftId ? { ...item, quantity: total } : item)
    : [...items, { nftId, quantity: total }]

  return replaceCartItems(next) ? total : null
}

export function setCartQuantity(nftId: string, quantity: number, availableQuantity: number): boolean {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(availableQuantity) || availableQuantity < 1) return false
  const items = getCartItems()
  if (!items.some((item) => item.nftId === nftId)) return false
  return replaceCartItems(items.map((item) => item.nftId === nftId ? { ...item, quantity: Math.min(quantity, availableQuantity) } : item))
}

export function removeFromCart(nftId: string): boolean {
  return replaceCartItems(getCartItems().filter((item) => item.nftId !== nftId))
}

export function applyConfirmedOrderToCart(orderId: string, purchased: CartItem[]): boolean {
  try {
    const applied: unknown = JSON.parse(localStorage.getItem(appliedOrdersKey) ?? '[]')
    const ids = Array.isArray(applied) ? applied.filter((id): id is string => typeof id === 'string') : []
    if (ids.includes(orderId)) return true
    const before = getCartItems()
    const quantities = new Map(purchased.map((item) => [item.nftId, item.quantity]))
    const remaining = before.flatMap((item) => {
      const quantity = item.quantity - (quantities.get(item.nftId) ?? 0)
      return quantity > 0 ? [{ ...item, quantity }] : []
    })
    if (!replaceCartItems(remaining)) return false
    try { localStorage.setItem(appliedOrdersKey, JSON.stringify([...ids, orderId])) }
    catch { replaceCartItems(before); return false }
    return true
  } catch { return false }
}
