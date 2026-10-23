import { createFileRoute } from '@tanstack/react-router'

import { OrderConfirmationPage } from '@/features/cart/components/order-confirmation-page'

export const Route = createFileRoute('/pedido/$orderId')({
  component: OrderConfirmationPage,
})
