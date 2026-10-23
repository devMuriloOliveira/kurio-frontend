
export type NFT = {
  id: string
  name: string
  description?: string
  collection?: string
  category?: string
  imageUrl?: string
  priceEth?: string
  previousPriceEth?: string
  badge?: string
  network?: 'ethereum' | 'polygon' | 'solana'
  availableQuantity?: number
  creator?: string
  edition?: string
  version?: number
}
