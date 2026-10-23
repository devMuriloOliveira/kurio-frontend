import { test, expect, type Page } from '@playwright/test'

async function prepareCheckout(page: Page) {
  const username = `pedido${Math.random().toString(36).slice(2, 10)}`
  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Entrar' }).first().click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill(username)
  await page.getByRole('textbox', { name: 'E-mail' }).fill(`${username}@example.test`)
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaTeste#2026')
  await page.getByRole('textbox', { name: 'Confirmar senha' }).fill('SenhaTeste#2026')
  await page.getByRole('button', { name: 'Criar conta' }).last().click()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.getByRole('button', { name: 'Carteiras' }).click()
  const wallet = page.locator('main form').first()
  await wallet.getByRole('textbox', { name: 'Nome de exibição' }).fill('Colecionador teste')
  await wallet.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Principal')
  await wallet.getByRole('textbox', { name: 'Endereço da carteira' }).fill('0x1111111111111111111111111111111111111111')
  await wallet.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva com sucesso.')).toBeVisible()
  await page.goto('/nfts/emerald-ape-042')
  await page.locator('main').getByRole('button', { name: 'COMPRAR', exact: true }).click()
  await page.goto('/carrinho')
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await page.getByLabel('Carteira cadastrada').selectOption({ label: 'Principal · ethereum' })
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

test('recusa preserva carrinho; pedido pendente resolve por consulta REST', async ({ page }) => {
  await prepareCheckout(page)
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-order-outcome-v1', 'declined'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-cart-v1') ?? '[]'))).toEqual([{ nftId: 'emerald-ape-042', quantity: 1 }])

  await page.goto('/checkout')
  await page.getByLabel('Carteira cadastrada').selectOption({ label: 'Principal · ethereum' })
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-order-outcome-v1', 'pending-confirmed'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-cart-v1') ?? '[]'))).toHaveLength(1)
  await page.waitForTimeout(750)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na simulação' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-cart-v1') ?? '[]'))).toHaveLength(0)
})

test('timeout mantém chave, refresh recupera pedido único e desconta só quantidade comprada', async ({ page }) => {
  await prepareCheckout(page)
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-order-timeout-once-v1', '1'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('button', { name: 'Recuperar pedido' })).toBeVisible({ timeout: 15_000 })
  await page.evaluate(() => localStorage.setItem('kurio-cart-v1', JSON.stringify([{ nftId: 'emerald-ape-042', quantity: 2 }])))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Recuperar pedido' })).toBeVisible()
  await page.getByRole('button', { name: 'Recuperar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na simulação' })).toBeVisible()
  const orderId = page.url().split('/').at(-1)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-cart-v1') ?? '[]'))).toEqual([{ nftId: 'emerald-ape-042', quantity: 1 }])
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-demo-orders-v1') ?? '[]'))).toHaveLength(1)
  await page.reload()
  expect(page.url().split('/').at(-1)).toBe(orderId)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-cart-v1') ?? '[]'))).toEqual([{ nftId: 'emerald-ape-042', quantity: 1 }])
})

test('mudança de taxa ou cupom exige nova revisão antes de criar pedido', async ({ page }) => {
  await prepareCheckout(page)
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-network-fee-eth-v1', '0.025'))
  const rejected = page.waitForResponse((response) => response.url().endsWith('/api/orders') && response.status() === 409)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await rejected
  await expect(page.getByRole('button', { name: 'Revisar compra' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-demo-orders-v1') ?? '[]'))).toHaveLength(0)
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na simulação' })).toBeVisible()
})

test('preço e estoque alterados invalidam a cotação antes do pedido', async ({ page }) => {
  await prepareCheckout(page)
  await page.evaluate(async () => {
    const response = await fetch('/api/nfts')
    const { data } = await response.json() as { data: Array<{ id: string; priceEth: string; availableQuantity: number; version: number }> }
    localStorage.setItem('kurio-demo-catalog-v1', JSON.stringify(data.map((nft) => nft.id === 'emerald-ape-042' ? { ...nft, priceEth: '1.29', availableQuantity: nft.availableQuantity - 1, version: nft.version + 1 } : nft)))
  })
  const rejected = page.waitForResponse((response) => response.url().endsWith('/api/orders') && response.status() === 409)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await rejected
  await expect(page.getByRole('button', { name: 'Revisar compra' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-demo-orders-v1') ?? '[]'))).toHaveLength(0)
})

test('cupom validado pela API expira e exige nova cotação', async ({ page }) => {
  await prepareCheckout(page)
  await page.goto('/carrinho')
  await page.getByLabel('Código promocional').fill('DEMO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Cupom DEMO10 aplicado.')).toBeVisible()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await page.getByLabel('Carteira cadastrada').selectOption({ label: 'Principal · ethereum' })
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-coupon-expired-v1', '1'))
  const rejected = page.waitForResponse((response) => response.url().endsWith('/api/orders') && response.status() === 409)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await rejected
  await expect(page.getByRole('button', { name: 'Revisar compra' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-demo-orders-v1') ?? '[]'))).toHaveLength(0)
})

test('cliques repetidos enviam uma única criação', async ({ page }) => {
  await prepareCheckout(page)
  let posts = 0
  page.on('request', (request) => { if (request.method() === 'POST' && request.url().endsWith('/api/orders')) posts++ })
  await page.getByRole('button', { name: 'Confirmar compra' }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na simulação' })).toBeVisible()
  expect(posts).toBe(1)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-demo-orders-v1') ?? '[]'))).toHaveLength(1)
})

test('pedido pendente pode ser recusado na consulta REST e mantém os itens', async ({ page }) => {
  await prepareCheckout(page)
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-order-outcome-v1', 'pending-declined'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  await page.waitForTimeout(750)
  await page.getByRole('button', { name: 'Atualizar estado' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kurio-cart-v1') ?? '[]'))).toEqual([{ nftId: 'emerald-ape-042', quantity: 1 }])
})
