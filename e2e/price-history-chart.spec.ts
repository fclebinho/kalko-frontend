import { test, expect } from '@playwright/test'
import { setupApiMocks } from './helpers'

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page)
})

test.describe('Price History Chart', () => {
  test('renders chart on recipe detail page', async ({ page }) => {
    await page.goto('/recipes/rec-1')

    // Wait for recipe to load
    await page.getByText('Bolo de Chocolate').first().waitFor()

    // Chart card should be visible
    await expect(page.getByText('Histórico de Custos e Preços')).toBeVisible()
  })

  test('shows chart with SVG lines', async ({ page }) => {
    await page.goto('/recipes/rec-1')
    await page.getByText('Bolo de Chocolate').first().waitFor()

    // PriceHistoryChart renders an SVG with role="application"
    const chartWrapper = page.locator('.h-\\[200px\\]')
    await expect(chartWrapper).toBeVisible()

    // Main chart SVG has role="application"
    const chartSvg = chartWrapper.locator('svg[role="application"]')
    await expect(chartSvg).toBeVisible()
  })

  test('does not render chart when no history data', async ({ page }) => {
    // Override history mock to return empty data
    await page.route(/\/v1\/history\//, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    })

    await page.goto('/recipes/rec-1')
    await page.getByText('Bolo de Chocolate').first().waitFor()

    // Chart title should not be visible when no data
    await expect(page.getByText('Histórico de Custos e Preços')).not.toBeVisible()
  })

  test('shows legend when multiple fields', async ({ page }) => {
    await page.goto('/recipes/rec-1')
    await page.getByText('Bolo de Chocolate').first().waitFor()

    // PriceHistoryChart legend should have field labels
    const historyChart = page.locator('.h-\\[200px\\]')
    const legend = historyChart.locator('.recharts-legend-wrapper')
    await expect(legend).toBeVisible()
  })

  test('renders recipe detail page with key sections', async ({ page }) => {
    await page.goto('/recipes/rec-1')

    // Wait for page to load
    await page.getByText('Bolo de Chocolate').first().waitFor()

    // Recipe info should be visible (prepTime shows in card)
    await expect(page.getByText('60 min').first()).toBeVisible()

    // Ingredients should be listed
    await expect(page.getByText('Farinha de Trigo').first()).toBeVisible()

    // Price history chart
    await expect(page.getByText('Histórico de Custos e Preços')).toBeVisible()

    // Action buttons
    await expect(page.getByRole('button', { name: /editar receita/i })).toBeVisible()
  })
})
