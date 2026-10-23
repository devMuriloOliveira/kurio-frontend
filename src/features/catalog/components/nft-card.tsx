
import { Heart } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { NFT } from '@/types/nft'

type NFTCardProps = {
  nft: NFT
  compact?: boolean
}

export function NFTCard({ nft, compact = false }: NFTCardProps) {
  return (
    <article className={`min-w-0 lg:pb-[10px] ${compact ? 'lg:w-full' : 'lg:w-[258px]'}`}>
      <div className={`relative lg:flex lg:items-center lg:justify-center lg:bg-sidebar lg:p-1 ${compact ? 'lg:aspect-square' : 'lg:h-[300px]'}`}>
        <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Ver detalhes de ${nft.name}`} className={`block w-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${compact ? '' : 'lg:w-[250px]'}`}>
          {nft.imageUrl ? (
            <img
              src={nft.imageUrl}
              alt={`Imagem do NFT ${nft.name}`}
              loading="lazy"
              className={`aspect-square w-full rounded-xl object-cover ${compact ? '' : 'lg:size-[250px]'}`}
            />
          ) : (
            <div
              role="img"
              aria-label={`Imagem original de ${nft.name} não disponível`}
              className={`flex aspect-square w-full items-center justify-center rounded-xl border border-primary/20 bg-sidebar p-4 text-center text-xs text-foreground/70 lg:border-transparent ${compact ? '' : 'lg:size-[250px]'}`}
            >
              Imagem original pendente
            </div>
          )}
        </Link>
        {nft.badge && (
          <span className="absolute top-2 left-0 bg-primary px-2 py-1 text-[9px] font-bold text-primary-foreground lg:hidden">
            {nft.badge}
          </span>
        )}
        {nft.id === 'emerald-ape-042' && (
          <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Abrir ${nft.name} para favoritar`} className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-sidebar/90 text-primary focus-visible:outline-2 focus-visible:outline-primary lg:hidden">
            <Heart aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>
      <h3 className="mt-2 text-[11px] leading-4 text-foreground lg:mt-0 lg:truncate lg:text-xs" title={nft.name}>
        {nft.name}
      </h3>
      {nft.priceEth ? (
        <p className="flex flex-wrap gap-x-2 text-xs leading-4 font-bold text-primary">
          <span className="whitespace-nowrap">{nft.priceEth} ETH</span>
          {nft.previousPriceEth && (
            <span className="whitespace-nowrap font-normal text-text-secondary line-through">
              {nft.previousPriceEth} ETH
            </span>
          )}
        </p>
      ) : (
        <p className="text-[10px] leading-4 text-foreground/60">Preço não informado</p>
      )}
    </article>
  )
}
