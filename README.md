# KURIO

Marketplace de NFTs para o desafio Frontend da Jungle Gaming. Esta é uma demonstração local com API simulada pelo MSW. Nenhum pagamento, conexão de carteira ou transferência em blockchain ocorre.

## Executar

Requer Node.js e npm. A validação local foi feita com Node.js 22.

```sh
npm ci
npm run dev
```

O arquivo `.env` contém `VITE_ENABLE_MOCKS=true`. Mantenha essa variável no build de demonstração. A aplicação aguarda o service worker do MSW antes de renderizar. Dados simulados são mantidos no armazenamento local do navegador.

```sh
npm run build
npm run preview
npx tsc -b
npm run lint
npm run test:e2e
```

`npm run build` inclui verificação de tipos. Os testes Playwright iniciam seu próprio Vite na porta 5174 e usam o Chrome instalado, em viewports 1440 × 900, 768 × 1024 e 390 × 844. O relatório HTML fica em `playwright-report/` e traces de falhas em `test-results/`. A suíte atual cobre carteiras, compra simulada, isolamento do recibo, detalhe direto e transição do carrinho entre visitante e sessão. A cobertura exigida pelo enunciado ainda não está completa.

## Fluxo demonstrável

1. Crie uma conta com credenciais **fictícias** pelo botão **Entrar → Criar conta**. Não há usuários pré cadastrados nem credenciais reais para a demonstração.
2. Abra **Perfil → Carteiras** e salve uma carteira na rede do NFT. Para Ethereum ou Polygon, use um endereço fictício `0x` seguido de 40 dígitos hexadecimais.
3. Abra um NFT com estoque, adicione ao carrinho, escolha a carteira no checkout e clique **Revisar compra**. A cotação vem de `POST /api/quotes`.
4. Clique **Confirmar compra**. A tela de recibo só abre depois de `POST /api/orders` devolver um pedido confirmado. O recibo é lido de `GET /api/orders/:id` e só aparece para a conta dona do pedido.

Carteiras principal e secundária podem ser cadastradas e editadas; os dados persistem após refresh. O carrinho visitante sobrevive ao refresh e ao login. Logout e troca de conta apagam o carrinho local para evitar que os itens de uma sessão apareçam na seguinte.

## Dados de teste e limitações

O mock é local ao navegador. Para restaurar o catálogo e apagar contas, sessões, carteiras, carrinho e pedidos de teste, limpe os dados do site no navegador e recarregue a página. Os testes E2E criam contextos isolados automaticamente. Esse reset apaga apenas dados simulados daquela origem.

É possível observar respostas 404 acessando `/nfts/identificador-inexistente`, erros de formulário em cadastro/carteiras e conflito de idempotência ao reutilizar uma chave com outra cotação. Cenários determinísticos de timeout, recusa, expiração de sessão, latência variável e mudança em tempo real ainda não estão disponíveis.

O projeto ainda **não atende integralmente ao desafio**: faltam Socket.IO funcional, favoritos e carrinho via REST, filtros e paginação por URL, cenários completos do MSW, testes de regressão visual e auditorias Lighthouse. Veja [AUDIT.md](AUDIT.md) e [ARCHITECTURE.md](ARCHITECTURE.md). Não há URL pública publicada por esta revisão.
