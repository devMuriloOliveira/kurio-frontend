import { expect, test, type Page } from '@playwright/test'

async function register(page: Page) {
  const username = `realtime${Math.random().toString(36).slice(2, 9)}`
  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Entrar' }).first().click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill(username)
  await page.getByRole('textbox', { name: 'E-mail' }).fill(`${username}@example.test`)
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaTeste#2026')
  await page.getByRole('textbox', { name: 'Confirmar senha' }).fill('SenhaTeste#2026')
  await page.getByRole('button', { name: 'Criar conta' }).last().click()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
}

async function updateNft(page: Page, priceEth: string, availableQuantity: number) {
  const status = await page.evaluate(async ({ priceEth, availableQuantity }) => {
    const token = localStorage.getItem('kurio-demo-auth-token-v1')
    const response = await fetch('/api/demo/nfts/emerald-ape-042', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ priceEth, availableQuantity }),
    })
    return { status: response.status, body: await response.text() }
  }, { priceEth, availableQuantity })
  if (status.status !== 200) throw new Error(JSON.stringify(status))
}

test('nft.updated altera catálogo, detalhe e carrinho pelo Socket.IO', async ({ page }) => {
  await register(page)
  await page.goto('/nfts/emerald-ape-042')
  await page.locator('main').getByRole('button', { name: 'COMPRAR', exact: true }).click()
  await page.goto('/carrinho')
  await expect(page.getByText('1.19 ETH').first()).toBeVisible()
  await updateNft(page, '1.31', 8)
  await expect(page.getByText('1.31 ETH').first()).toBeVisible()
  await page.goto('/nfts/emerald-ape-042')
  await expect(page.getByText('1.31 ETH').first()).toBeVisible()
  await updateNft(page, '1.32', 7)
  await expect(page.getByText('1.32 ETH').first()).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('1.32 ETH').first()).toBeVisible()
  await updateNft(page, '1.33', 6)
  await expect(page.getByText('1.33 ETH').first()).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByText('1.33 ETH').first()).toBeVisible()
  await updateNft(page, '1.33', 0)
  await expect(page.getByText(/Preço ou disponibilidade indisponível/)).toBeVisible()
})

test('order.updated confirma pedido pendente sem refresh ou consulta manual', async ({ page }) => {
  await register(page)
  await page.getByRole('button', { name: 'Carteiras' }).click()
  const wallet = page.locator('main form').first()
  await wallet.getByRole('textbox', { name: 'Nome de exibição' }).fill('Colecionador teste')
  await wallet.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Principal')
  await wallet.getByRole('textbox', { name: 'Endereço da carteira' }).fill('0x1111111111111111111111111111111111111111')
  await wallet.getByRole('button', { name: 'Salvar carteira' }).click()
  await page.goto('/nfts/emerald-ape-042')
  await page.locator('main').getByRole('button', { name: 'COMPRAR', exact: true }).click()
  await page.goto('/checkout')
  await page.getByLabel('Carteira cadastrada').selectOption({ label: 'Principal · ethereum' })
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-order-outcome-v1', 'pending-confirmed'))
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na simulação' })).toBeVisible({ timeout: 5000 })
})
