import { test, expect } from '@playwright/test'

test('cadastro, edição e recuperação de carteiras após refresh', async ({ page }) => {
  const username = `teste${Math.random().toString(36).slice(2, 10)}`
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
  const primary = page.locator('main form').first()
  await primary.getByRole('textbox', { name: 'Nome de exibição' }).fill('Carteira de teste')
  await primary.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Principal')
  await primary.getByRole('textbox', { name: 'Endereço da carteira' }).fill('0x1111111111111111111111111111111111111111')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva com sucesso.')).toBeVisible()

  await primary.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Principal editada')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva com sucesso.')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
  const secondary = page.locator('main form').last()
  await secondary.getByRole('textbox', { name: 'Nome de exibição' }).fill('Outra carteira')
  await secondary.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Secundária')
  await secondary.getByRole('textbox', { name: 'Nome do perfil' }).fill(username)
  await secondary.getByRole('textbox', { name: 'Endereço da carteira' }).fill('0x2222222222222222222222222222222222222222')
  await secondary.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await secondary.getByRole('button', { name: 'Salvar carteira secundária' }).click()
  await expect(page.getByText('Carteira secundária cadastrada.')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Carteiras' }).click()
  await expect(page.locator('main form').first().getByRole('textbox', { name: 'Apelido da carteira' })).toHaveValue('Principal editada')
  await expect(page.locator('main form').last().getByRole('textbox', { name: 'Apelido da carteira' })).toHaveValue('Secundária')
})
