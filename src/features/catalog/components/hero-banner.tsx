import { ArrowRight } from 'lucide-react'

function CarouselIndicators() {
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-1.5">
      <span className="size-1.5 rounded-full bg-primary" />
      <span className="size-1.5 rounded-full bg-primary/70" />
      <span className="size-1.5 rounded-full bg-primary/70" />
    </div>
  )
}

export function HeroBanner() {
  return (
    <>
      <section
        aria-labelledby="hero-desktop-title"
        className="mx-auto hidden w-full max-w-[1200px] grid-cols-[minmax(0,600px)_minmax(0,450px)] justify-between gap-6 lg:grid"
      >
        <div className="relative flex min-h-[450px] min-w-0 flex-col pl-10 pt-[43px] pb-[95px]">
          <p className="text-xs tracking-wide text-foreground">Bem-vindo à Kurio</p>
          <h1
            id="hero-desktop-title"
            className="mt-2 font-bold text-[36px] leading-[56px] text-foreground xl:text-[43px] xl:leading-[70px]"
          >
            <span className="block">SEJA DONO DO FUTURO</span>
            <span className="block">DA ARTE DIGITAL</span>
          </h1>
          <p className="mt-2 max-w-[480px] text-sm leading-6 text-primary/80">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>
          <a
            href="#catalogo"
            className="mt-6 inline-flex h-10 w-fit items-center rounded-md bg-primary px-5 text-xs font-bold text-primary-foreground hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            EXPLORAR
          </a>
          <div className="absolute right-10 bottom-8">
            <CarouselIndicators />
          </div>
        </div>
        <img
          src="/images/emerald-ape.png"
          alt="NFT Emerald Ape, macaco de óculos com jaqueta verde"
          className="aspect-square w-full max-w-[450px] rounded-[24px] object-cover"
        />
      </section>

      <section
        aria-labelledby="hero-mobile-title"
        className="relative h-[190px] w-full overflow-hidden rounded-[12px] bg-sidebar text-foreground lg:hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[31px] left-[calc(50vw-275px)] size-[248px] rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 40%, var(--sidebar))' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[10px] left-[calc(50vw-122px)] size-[248px] rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 30%, var(--sidebar))', opacity: 0.85 }}
        />

        <div className="relative z-10 w-[calc(100%-142px)] max-w-[196px] pl-4 pt-3">
          <p className="whitespace-nowrap text-[11px] leading-4 min-[410px]:text-xs">Bem-vindo à Kurio</p>
          <h1 id="hero-mobile-title" className="mt-2 text-[18px] leading-[29px] font-bold tracking-[-0.5px]">
            <span className="block whitespace-nowrap">SEJA DONO DA</span>
            <span className="block whitespace-nowrap">CULTURA DIGITAL</span>
          </h1>
          <p className="mt-1 text-[10px] leading-[15px] text-foreground/75 min-[390px]:text-[11px] min-[390px]:leading-[17px] min-[390px]:tracking-[-0.3px] min-[410px]:text-xs min-[410px]:leading-[19px]">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a
            href="#catalogo"
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            EXPLORAR <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>

        <img
          src="/images/emerald-ape.png"
          alt="NFT Emerald Ape, macaco de óculos com jaqueta verde"
          className="absolute top-3 right-4 z-10 size-[138px] rounded-[20px] object-cover"
        />
        <img
          src="/images/sage-nomad.png"
          alt="NFT Sage Nomad, macaco com chapéu e moletom roxo"
          className="absolute top-[100px] right-[82px] z-20 size-[58px] rounded-[14px] object-cover"
        />
        <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
          <CarouselIndicators />
        </div>
      </section>
    </>
  )
}
