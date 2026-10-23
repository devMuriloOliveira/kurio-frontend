import { createFileRoute } from '@tanstack/react-router'

import { CheckoutPage } from '@/features/cart/components/checkout-page'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})
