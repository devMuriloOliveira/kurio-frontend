import { createFileRoute } from '@tanstack/react-router'

import { NftDetailPage } from '@/features/nft-detail/components/nft-detail-page'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPage,
})
