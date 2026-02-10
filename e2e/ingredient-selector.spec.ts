import { test, expect } from '@playwright/test'
import { setupApiMocks } from './helpers'

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page)
})

test.describe('Ingredient Selector', () => {
  async function goToIngredientsStep(page: import('@playwright/test').Page) {
    await page.goto('/recipes/new')
    // Wait for step 1 to load
    await page.getByText('Nova Receita').waitFor()

    // Fill required step 1 fields
    await page.getByLabel('Nome da Receita *').fill('Teste Receita')
    await page.getByLabel('Tempo de Preparo (min) *').fill('30')
    await page.getByLabel('Rendimento *').fill('10')

    // Navigate to step 2 (Ingredientes)
    await page.getByRole('button', { name: 'Próximo' }).click()
    await page.getByText('Adicione os ingredientes').waitFor()
  }

  // Helper to get the popover trigger (first combobox, not the command input)
  function comboboxTrigger(page: import('@playwright/test').Page) {
    return page.locator('button[role="combobox"]')
  }

  test('shows ingredient selector on recipe form step 2', async ({ page }) => {
    await goToIngredientsStep(page)
    await expect(comboboxTrigger(page)).toBeVisible()
    await expect(page.getByText('Buscar ingrediente...')).toBeVisible()
  })

  test('opens ingredient list in combobox', async ({ page }) => {
    await goToIngredientsStep(page)
    await comboboxTrigger(page).click()

    // Should show ingredients from mock
    await expect(page.getByText('Farinha de Trigo')).toBeVisible()
    await expect(page.getByText('Açúcar')).toBeVisible()
    await expect(page.getByText('Leite')).toBeVisible()
  })

  test('filters ingredients by search', async ({ page }) => {
    await goToIngredientsStep(page)
    await comboboxTrigger(page).click()

    // Type in search
    await page.getByPlaceholder('Buscar ingrediente...').fill('Farinha')

    // Should show only matching ingredient
    await expect(page.getByText('Farinha de Trigo')).toBeVisible()
  })

  test('selects ingredient and shows it in combobox trigger', async ({ page }) => {
    await goToIngredientsStep(page)
    await comboboxTrigger(page).click()
    await page.getByText('Farinha de Trigo').click()

    // Trigger button should show selected ingredient name
    await expect(comboboxTrigger(page)).toContainText('Farinha de Trigo')
  })

  test('shows quantity and unit fields after selection', async ({ page }) => {
    await goToIngredientsStep(page)
    await comboboxTrigger(page).click()
    await page.getByText('Farinha de Trigo').click()

    // Quantity field should appear
    await expect(page.getByLabel('Quantidade')).toBeVisible()

    // Unit field should show 'g' and be disabled
    const unitInput = page.locator('input[disabled].bg-muted')
    await expect(unitInput).toBeVisible()
    await expect(unitInput).toHaveValue('g')
  })

  test('can switch between ingredients and sub-recipes tabs', async ({ page }) => {
    await goToIngredientsStep(page)

    // Click on sub-recipes tab
    await page.getByRole('button', { name: 'Sub-Receitas' }).click()

    // Should change label
    await expect(page.getByText('Selecione uma Receita')).toBeVisible()

    // Open combobox and check recipes
    await comboboxTrigger(page).click()
    await expect(page.getByText('Bolo de Chocolate')).toBeVisible()
    await expect(page.getByText('Brigadeiro')).toBeVisible()
  })

  test('add button is disabled without selection and quantity', async ({ page }) => {
    await goToIngredientsStep(page)

    // Add button should be disabled initially
    await expect(page.getByRole('button', { name: /adicionar ingrediente/i })).toBeDisabled()
  })

  test('adds ingredient with quantity to recipe', async ({ page }) => {
    await goToIngredientsStep(page)

    // Select ingredient
    await comboboxTrigger(page).click()
    await page.getByText('Farinha de Trigo').click()

    // Set quantity
    await page.getByLabel('Quantidade').fill('500')

    // Should show estimated cost
    await expect(page.getByText('Custo estimado:')).toBeVisible()

    // Click add
    await page.getByRole('button', { name: /adicionar ingrediente/i }).click()

    // Should show added ingredient in the list
    await expect(page.getByText('Ingredientes Adicionados (1)')).toBeVisible()
  })
})
