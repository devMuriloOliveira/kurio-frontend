import { ArrowRight } from 'lucide-react'

const articles = [
  {
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/neon-vessel.png',
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
  },
  {
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/emerald-ape.png',
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
  },
  {
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/sage-nomad.png',
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
  },
  {
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/golden-beat.png',
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
  },
] as const

export function EditorialSection() {
  return (
    <section aria-labelledby="editorial-title" className="mx-auto mt-24 w-full max-w-[1200px]">
      <div className="text-center">
        <h2 id="editorial-title" className="text-2xl font-bold text-foreground">Diário da Cunhagem</h2>
        <p className="mt-3 text-xs leading-5 text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-6 min-[500px]:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <article key={article.title} className="flex min-w-0 flex-col overflow-hidden rounded-md bg-sidebar">
            <img
              src={article.image}
              alt=""
              loading="lazy"
              className="aspect-[4/3] w-full object-cover object-top"
            />
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[10px] leading-4 text-text-secondary">
                {article.date} <span aria-hidden="true">|</span> {article.readingTime}
              </p>
              <h3 className="mt-2 text-sm leading-5 font-bold text-foreground">{article.title}</h3>
              <p className="mt-2 text-xs leading-[18px] text-text-secondary">{article.description}</p>
              <button
                type="button"
                disabled
                title="Artigo em breve"
                className="mt-auto inline-flex w-fit items-center gap-1 pt-4 text-xs font-semibold text-primary disabled:cursor-not-allowed"
              >
                Ler mais <ArrowRight aria-hidden="true" className="size-3.5" />
                <span className="sr-only">, indisponível</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
