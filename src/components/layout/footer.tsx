import { Button } from '@/components/ui/button'

const benefits = [
  {
    initial: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    initial: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    initial: 'D',
    title: 'Alertas de lançamentos',
    description: 'Novidades sobre calendários de cunhagem, listas de acesso e análises do mercado.',
  },
] as const

const linkGroups = [
  {
    title: 'Meu perfil',
    items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    items: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'],
  },
  {
    title: 'Coleções',
    items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
] as const

const socialNetworks = [
  { label: 'Facebook', icon: '/icons/facebook.svg' },
  { label: 'Instagram', icon: '/icons/instagram.svg' },
  { label: 'Twitter', icon: '/icons/twitter.svg' },
  { label: 'LinkedIn', icon: '/icons/linkedin.svg' },
  { label: 'YouTube', icon: '/icons/youtube.svg' },
] as const

export function Footer() {
  return (
    <footer aria-label="Rodapé da Kurio" className="mx-auto mt-24 w-full max-w-[1200px]">
      <div className="grid gap-8 bg-sidebar p-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:p-8">
        {benefits.map((benefit, index) => (
          <section key={benefit.title} className={`min-w-0 lg:pr-5 ${index > 0 ? 'lg:pl-6' : ''} lg:border-r lg:border-primary/40`}>
            <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {benefit.initial}
            </span>
            <h2 className="mt-3 text-sm font-bold text-foreground">{benefit.title}</h2>
            <p className="mt-2 text-[11px] leading-[18px] text-text-secondary">{benefit.description}</p>
          </section>
        ))}

        <section className="min-w-0 lg:pl-6">
          <h2 className="text-sm leading-5 font-bold text-foreground">Antecipe-se ao próximo lançamento</h2>
          <div className="mt-4 flex min-w-0">
            <label htmlFor="newsletter-email" className="sr-only">E-mail para a newsletter</label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="digite seu e-mail..."
              aria-describedby="newsletter-status"
              className="min-w-0 flex-1 rounded-l-md bg-primary/10 py-3 pr-2 pl-3 text-[11px] text-foreground placeholder:text-text-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            <Button type="button" size="sm" disabled title="Inscrições em breve" className="h-auto self-stretch rounded-l-none rounded-r-md px-3 font-bold disabled:opacity-80">
              Enviar
            </Button>
          </div>
          <p id="newsletter-status" className="mt-3 text-[11px] leading-[18px] text-text-secondary">
            Lançamentos selecionados, histórias de criadores e novidades do mercado. Inscrições em breve.
          </p>
        </section>
      </div>

      <div className="grid gap-4 bg-primary/15 px-6 py-6 text-[11px] text-foreground sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:px-8">
        <strong className="tracking-widest">KURIO</strong>
        <p>Feito para colecionadores, criadores e cultura</p>
        <p className="text-text-secondary">Contato em breve</p>
        <p className="text-text-secondary">+55 11 4002 8922</p>
      </div>

      <div className="grid grid-cols-1 gap-8 bg-sidebar px-6 py-8 min-[380px]:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {linkGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-bold text-foreground">{group.title}</h2>
            <ul className="mt-2 space-y-1 text-[11px] leading-5 text-text-secondary">
              {group.items.map((item) => (
                <li key={item}>
                  <button type="button" disabled title="Página em breve" className="text-left disabled:cursor-not-allowed">
                    {item}<span className="sr-only">, indisponível</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground">Redes sociais</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {socialNetworks.map((network) => (
              <span key={network.label} role="img" aria-label={`${network.label} indisponível`} title={`${network.label} em breve`} className="flex size-7 items-center justify-center rounded-sm border border-primary text-primary">
                <img src={network.icon} alt="" aria-hidden="true" className="size-4" />
              </span>
            ))}
          </div>
          <h2 className="mt-6 text-sm font-bold text-foreground">Carteiras compatíveis</h2>
          <div className="mt-2 text-[9px] text-primary">
            <span title="Integrações em breve" className="inline-block max-w-full rounded-sm border border-primary/50 px-1.5 py-1">METAMASK  •  WALLETCONNECT  •  COINBASE</span>
          </div>
          <p className="mt-2 text-[10px] text-text-secondary">Integrações em breve.</p>
        </div>
      </div>

      <p className="py-5 text-center text-[11px] text-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
