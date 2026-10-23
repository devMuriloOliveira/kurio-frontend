# Arquitetura e limites atuais

## Transporte e dados

`src/lib/api.ts` configura Axios com base `/api` e timeout de 10 s. `src/main.tsx` inicia o MSW quando `VITE_ENABLE_MOCKS=true`. `src/mocks/handlers.ts`, `auth-handlers.ts`, `commerce-handlers.ts` e `favorites-handlers.ts` atendem os recursos abaixo. O catálogo inicial está em `src/mocks/data/nfts.ts`.

| Recurso | Contrato atual |
| --- | --- |
| Conta | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Perfil | `GET/PATCH /profile`, `PATCH /profile/password` |
| Carteiras | `GET/POST /wallets`, `PATCH /wallets/:id` |
| NFTs | `GET /nfts` aceita `q`, `category`, `network`, `minPrice`, `maxPrice`, `sort` (`recent`, `price_asc`, `price_desc`, `name_asc`) e `page`; devolve `{data,total,page,pageSize,totalPages,facets}`. Com `page`, são 6 itens por página; sem `page`, devolve a lista completa para os consumidores existentes. `GET /nfts/:id` atende o detalhe. |
| Favoritos | `GET /favorites` → `{data: string[]}`; `POST /favorites` com `{nftId}`; `DELETE /favorites/:nftId` → 204 |
| Cupom | `POST /coupons/validate` com `{code}`; cenário fictício `DEMO10` concede 10% e pode expirar no mock |
| Cotação | `POST /quotes` com `{items: [{nftId, quantity}], walletId, couponCode}`; resposta `{data: Quote}` com preço, disponibilidade, desconto, taxa e validade de 5 min |
| Pedidos | `POST /orders` com `{quoteId}` e header `Idempotency-Key`; `GET /orders/:id`; resposta `{data: Order}` |

Os endpoints de perfil, carteiras, favoritos, cotação e pedidos exigem `Authorization: Bearer <token>`. Cada GET de carteiras, favoritos e pedidos filtra por usuário; a cotação valida a posse da carteira. As respostas de erro usam `{message}` e status 401, 404, 409, 422 ou 503 conforme o caso. A mesma chave de idempotência e a mesma cotação devolvem o mesmo pedido; reutilizar a chave com outra cotação ou usar novamente a cotação com outra chave produz 409.

Contas, sessões, carteiras, favoritos por usuário, catálogo mutável, cotações e pedidos persistem em chaves `kurio-demo-*` do `localStorage`. Senhas são guardadas no mock como hash SHA-256 com salt, nunca em claro. Isso serve apenas para uma simulação no navegador: o armazenamento e o hash não representam uma estratégia segura de autenticação de produção. Não há backend remoto.

O handler MSW revalida cotação, preço, estoque, cupom e taxa antes de criar o pedido. O padrão confirma imediatamente; cenários configuráveis criam pedido `pending` ou `declined`. Uma consulta `GET /orders/:id` pode resolver o pendente em confirmado ou recusado; não há polling nem evento em tempo real. O recibo conserva o snapshot dos itens e valores. A tentativa `{token,quoteId,key}` fica em `sessionStorage` antes do POST; após timeout ou refresh, o checkout repete a mesma chave para recuperar o mesmo pedido. O carrinho só desconta as quantidades do pedido confirmado, com marcador local por ID para evitar desconto duplo. `transactionId` começa com `sim-` e não aponta para blockchain. O carrinho continua local e não é fonte de verdade para a compra. A atualização de catálogo e o registro do pedido usam chaves separadas no armazenamento, sem atomicidade de banco de dados.

## Estado da interface

TanStack Router atende rotas de início, detalhe, carrinho, checkout, perfil e pedido. Na rota inicial, busca, categoria, rede, faixa de preço, ordenação e página ficam na URL; mudar um filtro reinicia a página. Não há guards de rota; as telas privadas exibem bloqueio dentro do componente.

TanStack Query usa `staleTime` de 30 s, `gcTime` de 5 min, um retry e sem refetch ao focar a janela. A lista do catálogo usa chave com todos os parâmetros e passa `AbortSignal` ao Axios; uma resposta antiga não substitui a consulta da URL atual. Perfil e carteiras usam chaves com token; pedido usa token e id. Favoritos usam chave com token, não fazem consulta sem sessão e têm mutation otimista com rollback e invalidação após a resposta. Logout, troca de usuário e 401 da consulta de sessão removem caches privados (`auth`, `profile`, `wallets`, `orders`); o cache de favoritos fica separado por token até o `gcTime`, sem ser exibido para outra sessão. O catálogo público permanece. O carrinho é um armazenamento local do visitante que é preservado no login e apagado no logout ou troca de conta.

O MSW aceita `sessionStorage['kurio-demo-catalog-error-v1']='1'` para falha 503 de listagem, `sessionStorage['kurio-demo-catalog-delay-q-v1']='<busca>'` para latência de 650 ms e `sessionStorage['kurio-demo-favorites-fail-once-v1']='GET'|'POST'|'DELETE'` para uma falha 503 de favoritos. Esses controles exercitam erro, retry, respostas fora de ordem e rollback nos testes sem respostas fictícias no frontend.

Para pedidos, `kurio-demo-order-outcome-v1` aceita `declined`, `pending-confirmed` ou `pending-declined`; `kurio-demo-order-timeout-once-v1='1'` atrasa uma resposta após persistir o pedido; `kurio-demo-network-fee-eth-v1` altera a taxa; `kurio-demo-coupon-expired-v1='1'` invalida `DEMO10`. Esses controles pertencem somente ao mock de demonstração.

Na ordenação, `recent` conserva a ordem da fixture; não existem datas de publicação verificadas. As opções de preço comparam valores ETH como inteiros em wei, e a de nome usa ordem alfabética.

## Tempo real e apresentação

Socket.IO ainda não está integrado à aplicação. Experimentos anteriores com MSW 2.15, `@mswjs/socket.io-binding` 0.2.0 e `socket.io-client` 4.8 não estabeleceram conexão, mas não isolaram a causa. Em um novo teste mínimo no Chrome, com MSW 3.0.3, o primeiro registro passou incorretamente o objeto retornado por `ws.link()` ao `setupWorker`; o MSW avisou `intercepted a WebSocket connection without a matching event handler`. A API tipada mostra que `link.addEventListener('connection', ...)` retorna o handler que deve ser passado ao worker. Corrigido o registro, o WebSocket simples abriu, o callback executou e o navegador recebeu `msw-probe-ok`.

Na mesma página isolada, com o worker iniciado antes da importação dinâmica de `socket.io-client` 4.8.3, `@mswjs/socket.io-binding` 0.2.0 completou o handshake em transporte WebSocket: o cliente conectou, enviou `probe.hello` e recebeu `probe.reply` do handler MSW. Os dois testes Playwright passaram. A instalação temporária exigiu `--legacy-peer-deps`, pois o binding declara `msw: ^2.10.2` e não oferece compatibilidade declarada com o MSW 3.0.3 do projeto. Assim, o transporte foi comprovado neste ambiente, mas a combinação de versões não está dentro do contrato de dependências publicado. Os arquivos do experimento foram removidos; nenhum evento de domínio foi implementado.

Para uma integração que respeite as dependências publicadas, a alternativa preferível é testar MSW 2.15 com `@mswjs/socket.io-binding` 0.2.0 e `socket.io-client` 4.8.3 em uma etapa própria, preservando o worker no build de demonstração. O experimento atual também mostra que MSW 3 funciona com o binding no navegador, porém somente com peer dependency incompatível ignorada; isso exige uma decisão explícita antes de integrar eventos de domínio, reconciliação REST, versões e isolamento por usuário.

Os assets estão em `public/images` e `public/icons`. Algumas descrições e avaliações de NFT são ilustrativas. A composição usa classes Tailwind e componentes em `src/components/ui`. A fidelidade ao Figma ainda requer comparação visual formal; não há baselines Playwright nem relatórios Lighthouse. Não houve deploy nesta revisão. O ambiente publicado precisará manter o MSW ativo e servir `index.html` para acesso direto às rotas.
