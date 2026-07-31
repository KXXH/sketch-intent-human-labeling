import { expect, test } from '@playwright/test'

test('saves one annotation, restores it after reload, and marks skips', async ({ page }) => {
  await page.goto('./')
  await page.getByLabel('Anonymous annotator ID').fill('e2e-annotator')
  await page.getByRole('button', { name: 'Begin' }).click()

  await expect(page.getByRole('heading', { name: 'Sketch sequence' })).toBeVisible()
  await expect(page.locator('.frame-card img')).toHaveCount(4)
  await page.getByLabel('Target').fill('the marked chart element')
  await page.getByRole('radio', { name: /Blink/ }).click()
  await page.getByRole('button', { name: 'Not shown' }).nth(0).click()
  await page.getByRole('button', { name: 'Not shown' }).nth(1).click()
  await page.getByRole('radio', { name: '5' }).click()
  await page.getByLabel('Explanation').fill('The sketch clearly marks the intended target.')
  await page.getByRole('button', { name: 'Save & next' }).click()

  await expect(page.getByLabel('1 of 80 cases complete')).toBeVisible()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await expect(page.getByText('1 to revisit', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('e2e-annotator', { exact: true })).toBeVisible()
  await expect(page.getByLabel('1 of 80 cases complete')).toBeVisible()
  await expect(page.getByText('1 to revisit', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Final export/ })).toBeDisabled()
})

test('protects an active session from a second tab', async ({ context, page }) => {
  await page.goto('./')
  await page.getByLabel('Anonymous annotator ID').fill('multi-tab-user')
  await page.getByRole('button', { name: 'Begin' }).click()
  await expect.poll(() => page.evaluate(() => {
    const keys = Object.keys(localStorage)
    return keys.some((key) => key.endsWith(':lease')) && keys.some((key) => key.endsWith(':main'))
  })).toBe(true)
  const second = await context.newPage()
  await second.goto('./')
  await expect(second.getByText('This session is open in another tab.')).toBeVisible()
  await expect(second.getByText('multi-tab-user', { exact: true })).toBeVisible()
  await expect(second.getByLabel('Target')).toBeDisabled()
})
