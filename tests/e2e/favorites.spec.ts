import { expect, test, type Page } from '@playwright/test'

const password = 'SenhaTeste#2026'

async function register(page: Page, username: string) {
  await page.getByRole('button', { name: 'Entrar' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Criar conta' }).first().click()
  await dialog.getByRole('textbox', { name: 'Nome de usuário' }).fill(username)
  await dialog.getByRole('textbox', { name: 'E-mail' }).fill(`${username}@example.test`)
  await dialog.getByRole('textbox', { name: 'Senha', exact: true }).fill(password)
  await dialog.getByRole('textbox', { name: 'Confirmar senha' }).fill(password)
  await dialog.locator('form').getByRole('button', { name: 'Criar conta' }).click()
  await expect(dialog).toBeHidden()
}

test('favoritos usam REST, rollback e isolamento entre usuários', async ({ page }) => {
  test.setTimeout(60_000)
  const firstUser = `favorito${Math.random().toString(36).slice(2, 10)}`
  const secondUser = `outro${Math.random().toString(36).slice(2, 10)}`
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click()
  await expect(page.getByText('Entre na conta para favoritar.')).toBeVisible()

  await register(page, firstUser)
  const favoriteButton = page.getByRole('button', { name: 'Favoritar', exact: true })
  await expect(favoriteButton).toBeEnabled()
  await page.evaluate(() => sessionStorage.setItem('kurio-demo-favorites-fail-once-v1', 'POST'))
  const failed = page.waitForResponse((response) => response.url().endsWith('/api/favorites') && response.request().method() === 'POST')
  await favoriteButton.click()
  expect((await failed).status()).toBe(503)
  await expect(page.getByText('Não foi possível salvar o favorito. Tente novamente.')).toBeVisible()
  await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false')

  const saved = page.waitForResponse((response) => response.url().endsWith('/api/favorites') && response.request().method() === 'POST')
  await favoriteButton.click()
  expect((await saved).status()).toBe(200)
  await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await register(page, secondUser)
  await expect(page.getByRole('button', { name: 'Favoritar', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await page.getByRole('button', { name: 'Entrar' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'E-mail' }).fill(`${firstUser}@example.test`)
  await dialog.getByRole('textbox', { name: 'Senha', exact: true }).fill(password)
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute('aria-pressed', 'true')

  const removed = page.waitForResponse((response) => response.url().endsWith('/api/favorites/emerald-ape-042') && response.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Favoritado' }).click()
  expect((await removed).status()).toBe(204)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Favoritar', exact: true })).toHaveAttribute('aria-pressed', 'false')
})
