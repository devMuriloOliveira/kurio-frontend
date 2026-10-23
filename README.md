
# KURIO

Marketplace de NFTs desenvolvido como desafio técnico Frontend para a **Jungle Gaming**.

O KURIO permite explorar coleções de NFTs, pesquisar e filtrar itens, gerenciar favoritos, criar uma conta, cadastrar carteiras e realizar compras demonstrativas.

O projeto utiliza APIs simuladas e não realiza pagamentos reais, conexões com carteiras externas ou transferências em blockchain.

### Links

- **Aplicação:** https://kurio-frontend.vercel.app/
- **Repositório:** https://github.com/devMuriloOliveira/kurio-frontend

## Tecnologias

- React e TypeScript
- Vite
- Tailwind CSS e shadcn/ui
- TanStack Router
- TanStack Query
- Axios
- Mock Service Worker (MSW)
- Socket.IO
- Playwright
- Lighthouse CI

## Funcionalidades

### Catálogo de NFTs

- Listagem de NFTs com paginação.
- Busca por nome e coleção.
- Filtros de categoria, rede e faixa de preço.
- Ordenação por critérios disponíveis.
- Sincronização dos filtros com a URL.
- Página de detalhes de cada NFT.
- Favoritos associados à conta, usando API simulada.

### Autenticação e perfil

- Cadastro, login e logout demonstrativos.
- Persistência da sessão.
- Perfil do colecionador.
- Edição de informações pessoais e avatar.
- Alteração de senha.
- Cadastro e edição de carteiras principal e secundária.

### Carrinho e checkout

- Adição e remoção de NFTs.
- Alteração de quantidades.
- Persistência local do carrinho.
- Validação de disponibilidade e preços.
- Cotação simulada com taxas e descontos.
- Pedidos com estados pendente, confirmado e recusado.
- Recuperação de pedidos após timeout.
- Prevenção de pedidos duplicados por idempotência.
- Confirmação demonstrativa da compra.

### Atualizações em tempo real

O projeto utiliza Socket.IO com simulação de eventos via MSW:

- `nft.updated`: mudanças de preço e disponibilidade.
- `order.updated`: atualizações de estado dos pedidos.

Os eventos são utilizados para sincronizar as consultas da aplicação com os dados da API simulada.

## Executar localmente

### Requisitos

- Node.js 22
- npm

Instale as dependências:

```bash
npm ci
```

Copie `.env.example` para `.env` e configure:

```env
VITE_ENABLE_MOCKS=true
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Build e validação

```bash
npm run lint
npm run build
npm run test:e2e
```

O build inclui a verificação de tipos TypeScript.

Os testes Playwright utilizam o Chrome e cobrem fluxos da aplicação em resoluções desktop, tablet e mobile.

Para executar a versão de produção localmente:

```bash
npm run preview
```

## Lighthouse

Execute as auditorias de desempenho com:

```bash
npm run lighthouse
```

Para executar individualmente:

```bash
npm run lighthouse:mobile
npm run lighthouse:desktop
```

Os relatórios HTML e JSON são gerados em `lighthouse-reports/`.

As medições locais podem apresentar resultados diferentes daqueles obtidos na aplicação publicada.

## Publicação

O projeto está publicado na Vercel:

https://kurio-frontend.vercel.app/

A aplicação utiliza `vercel.json` para permitir o acesso direto às rotas do TanStack Router.

Para reproduzir o deploy demonstrativo, configure a variável de ambiente:

```env
VITE_ENABLE_MOCKS=true
```

Essa variável deve estar disponível durante o build da aplicação.

O MSW simula os endpoints REST e os eventos Socket.IO no navegador, sem a necessidade de um backend privado.

## Como testar a aplicação

1. Acesse a aplicação publicada.
2. Clique em **Entrar → Criar conta** e cadastre uma conta demonstrativa.
3. Acesse **Perfil → Carteiras** e cadastre uma carteira compatível com a rede de um NFT.
4. Navegue pelo catálogo e selecione um NFT disponível.
5. Adicione o NFT ao carrinho.
6. Acesse o checkout e selecione a carteira cadastrada.
7. Clique em **Revisar compra** e confirme a operação demonstrativa.
8. Confira os dados do pedido na tela de confirmação.

Para redes Ethereum e Polygon, o formulário aceita endereços demonstrativos no formato `0x` seguido de 40 caracteres hexadecimais.

**Utilize somente dados e credenciais fictícias.**

## Dados simulados e limitações

Os dados da demonstração são armazenados localmente no navegador e não são compartilhados entre diferentes dispositivos.

Para reiniciar o ambiente demonstrativo, limpe os dados do site no navegador e atualize a página.

O projeto foi desenvolvido para fins de avaliação técnica e apresenta algumas limitações conhecidas:

- O carrinho utiliza armazenamento local, sem operações REST dedicadas.
- Não há conexão real com carteiras de criptomoedas.
- Nenhuma transferência de NFT ou pagamento real é realizado.
- Alguns cenários avançados de falha e reconexão ainda possuem cobertura de testes limitada.
- A cobertura de regressão visual automatizada não está completa.

Detalhes adicionais sobre a arquitetura, os contratos simulados e as pendências estão documentados em:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AUDIT.md](./AUDIT.md)

## Considerações finais

O KURIO foi desenvolvido para demonstrar práticas de desenvolvimento Frontend, componentização, gerenciamento de estado, integração com APIs, tratamento de fluxos assíncronos e testes automatizados.

O foco do projeto foi construir uma experiência funcional e responsiva, utilizando serviços simulados para representar operações de um marketplace de NFTs.
