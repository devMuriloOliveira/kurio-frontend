import { ArrowRight } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const banners = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/emerald-ape.png',
    imageAlt: 'Emerald Ape com óculos e jaqueta verde',
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/neon-vessel.png',
    imageAlt: 'Neon Vessel com blazer claro',
  },
] as const

export function PromotionalBanners() {
  return (
    <section aria-label="Destaques da Kurio" className="mx-auto mt-20 grid w-full max-w-[1200px] gap-6 lg:grid-cols-2">
      {banners.map((banner) => (
        <article key={banner.title} className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-sidebar sm:h-[224px] sm:flex-row lg:h-[250px]">
          <img
            src={banner.image}
            alt={banner.imageAlt}
            loading="lazy"
            className="h-[190px] w-full object-cover sm:h-full sm:w-[48%] sm:shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-3 p-5 sm:items-end sm:text-right lg:p-6">
            <h2 className="text-sm leading-5 font-bold text-foreground">{banner.title}</h2>
            <p className="text-[11px] leading-[18px] text-text-secondary">{banner.description}</p>
            <a
              href="#catalogo"
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1 rounded-md px-4 text-[11px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary')}
            >
              Explorar <ArrowRight aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </article>
      ))}
    </section>
  )
}
