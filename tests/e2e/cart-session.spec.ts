import { test, expect } from '@playwright/test'

test('carrinho do visitante acompanha login e não aparece após logout', async ({ page }) => {
  const username = `carrinho${Math.random().toString(36).slice(2, 10)}`
  await page.goto('/nfts/emerald-ape-042')
  await page.locator('main').getByRole('button', { name: 'COMPRAR', exact: true }).click()
  await page.goto('/carrinho')
  await expect(page.locator('main')).toContainText('Emerald Ape #042')
  await page.reload()
  await expect(page.locator('main')).toContainText('Emerald Ape #042')

  await page.getByRole('button', { name: 'Entrar' }).first().click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill(username)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(`${username}@example.test`)
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaTeste#2026')
  await page.getByRole('textbox', { name: 'Confirmar senha' }).fill('SenhaTeste#2026')
  await page.getByRole('button', { name: 'Criar conta' }).last().click()
  await expect(page.locator('main')).toContainText('Emerald Ape #042')
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})
