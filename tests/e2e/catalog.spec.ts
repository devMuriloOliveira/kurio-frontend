import { test, expect } from '@playwright/test'

test('detalhe abre diretamente e NFT inexistente mostra 404', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.goto('/nfts/identificador-inexistente')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('páginas principais não cortam conteúdo horizontalmente', async ({ page }) => {
  for (const path of ['/', '/nfts/emerald-ape-042', '/carrinho', '/checkout', '/perfil']) {
    await page.goto(path)
    await page.locator('main').waitFor()
    const width = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }))
    expect(width.document, `Overflow horizontal em ${path}`).toBeLessThanOrEqual(width.viewport + 1)
  }
})
