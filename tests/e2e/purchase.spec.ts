import { test, expect } from '@playwright/test'

test('compra somente após resposta da API e recibo isolado por usuário', async ({ page }) => {
  const username = `compra${Math.random().toString(36).slice(2, 10)}`
  const email = `${username}@example.test`
  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Entrar' }).first().click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill(username)
  await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
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
  await expect(page).toHaveURL(/\/checkout$/)
  await page.getByLabel('Carteira cadastrada').selectOption({ label: 'Principal · ethereum' })
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await expect(page.getByText('Revise a cotação da API simulada e confirme a compra.')).toBeVisible()
  const orderResponse = page.waitForResponse((response) => response.url().endsWith('/api/orders') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const created = await orderResponse
  expect(created.status()).toBe(201)
  const orderId = (await created.json()).data.id as string
  const quoteId = (created.request().postDataJSON() as { quoteId: string }).quoteId
  const key = created.request().headers()['idempotency-key']
  const repeated = await page.evaluate(async ({ quoteId, key }) => {
    const token = localStorage.getItem('kurio-demo-auth-token-v1')
    const response = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': key },
      body: JSON.stringify({ quoteId }),
    })
    return { status: response.status, id: (await response.json()).data?.id as string | undefined }
  }, { quoteId, key })
  expect(repeated).toEqual({ status: 200, id: orderId })
  const conflicting = await page.evaluate(async ({ key }) => {
    const token = localStorage.getItem('kurio-demo-auth-token-v1')
    const response = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': key },
      body: JSON.stringify({ quoteId: crypto.randomUUID() }),
    })
    return response.status
  }, { key })
  expect(conflicting).toBe(409)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na simulação' })).toBeVisible()
  const receiptUrl = page.url()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado na simulação' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await page.goto(receiptUrl)
  await expect(page.getByRole('heading', { name: 'Acesso restrito' })).toBeVisible()
})
