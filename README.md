# KURIO

Marketplace de NFTs para o desafio Frontend da Jungle Gaming. Esta é uma demonstração local com API simulada pelo MSW. Nenhum pagamento, conexão de carteira ou transferência em blockchain ocorre.

## Executar

Requer Node.js e npm. A validação local foi feita com Node.js 22.

```sh
npm ci
npm run dev
```

Copie .env.example para .env e mantenha VITE_ENABLE_MOCKS=true no build de demonstração. No deploy, configure essa variável no projeto Vercel para os ambientes Production e Preview; variáveis VITE_* são incorporadas durante o build. O MSW inicia antes da interface e mantém os dados simulados no armazenamento local do navegador.

```sh
npm run build
npm run preview
npx tsc -b
npm run lint
npm run test:e2e
```

`npm run build` inclui verificação de tipos. Os testes Playwright iniciam seu próprio Vite na porta 5174 e usam o Chrome instalado, em viewports 1440 × 900, 768 × 1024 e 390 × 844. O relatório HTML fica em `playwright-report/` e traces de falhas em `test-results/`. A suíte atual cobre carteiras, compra simulada, isolamento do recibo, detalhe direto e transição do carrinho entre visitante e sessão. A cobertura exigida pelo enunciado ainda não está completa.

## Publicação e Lighthouse

A configuração vercel.json encaminha somente as rotas do TanStack Router para index.html; assets, /mockServiceWorker.js e caminhos de API/WebSocket continuam fora dos rewrites. Configure VITE_ENABLE_MOCKS=true no Vercel antes do build para habilitar handlers REST e Socket.IO simulados no navegador. Não há backend privado nem URL pública publicada por esta revisão.

Com Chrome instalado, execute npm run lighthouse para build e três medições de cada página nos perfis mobile e desktop. Para executar um perfil: npm run lighthouse:mobile ou npm run lighthouse:desktop. Relatórios JSON e HTML são gravados em lighthouse-reports/<perfil>/; as medições não são pré-executadas durante o build normal.

## Fluxo demonstrável

1. Crie uma conta com credenciais **fictícias** pelo botão **Entrar → Criar conta**. Não há usuários pré cadastrados nem credenciais reais para a demonstração.
2. Abra **Perfil → Carteiras** e salve uma carteira na rede do NFT. Para Ethereum ou Polygon, use um endereço fictício `0x` seguido de 40 dígitos hexadecimais.
3. Abra um NFT com estoque, adicione ao carrinho, escolha a carteira no checkout e clique **Revisar compra**. A cotação vem de `POST /api/quotes`.
4. Clique **Confirmar compra**. A tela de recibo só abre depois de `POST /api/orders` devolver um pedido confirmado. O recibo é lido de `GET /api/orders/:id` e só aparece para a conta dona do pedido.

Carteiras principal e secundária podem ser cadastradas e editadas; os dados persistem após refresh. O carrinho visitante sobrevive ao refresh e ao login. Logout e troca de conta apagam o carrinho local para evitar que os itens de uma sessão apareçam na seguinte.

## Dados de teste e limitações

O mock é local ao navegador. Para restaurar o catálogo e apagar contas, sessões, carteiras, carrinho e pedidos de teste, limpe os dados do site no navegador e recarregue a página. Os testes E2E criam contextos isolados automaticamente. Esse reset apaga apenas dados simulados daquela origem.

É possível observar respostas 404 acessando `/nfts/identificador-inexistente`, erros de formulário em cadastro/carteiras e conflito de idempotência ao reutilizar uma chave com outra cotação. O mock também oferece resultados de pedido pendente, confirmado e recusado, recuperação após timeout, falhas controladas de catálogo/favoritos e eventos Socket.IO simulados; os cenários disponíveis estão descritos em `ARCHITECTURE.md`.

O projeto ainda **não atende integralmente ao desafio**: permanecem lacunas documentadas em carrinho via REST, cenários completos do MSW, testes de regressão visual e cobertura Lighthouse. Socket.IO e favoritos estão implementados. Veja [AUDIT.md](AUDIT.md) e [ARCHITECTURE.md](ARCHITECTURE.md). Não há URL pública publicada por esta revisão.
