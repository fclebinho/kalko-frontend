import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { setupApiMocks, createCSVContent } from './helpers'

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page)
})

test.describe('CSV Import Dialog', () => {
  test('opens dialog when clicking Importar CSV button', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()
    await expect(page.getByText('Importar Ingredientes via CSV')).toBeVisible()
  })

  test('shows upload area with drag-and-drop instructions', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()
    await expect(page.getByText(/arraste um arquivo csv/i)).toBeVisible()
    await expect(page.getByText(/máximo.*500 linhas.*5mb/i)).toBeVisible()
  })

  test('shows download template button', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()
    await expect(page.getByRole('button', { name: /baixar template csv/i })).toBeVisible()
  })

  test('uploads valid CSV and advances to column mapping step', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()

    const csvContent = createCSVContent([
      ['name', 'quantity', 'cost', 'unit'],
      ['Manteiga', '500', '15.90', 'g'],
      ['Chocolate', '1000', '32.50', 'g'],
    ])

    const tmpFile = path.join(__dirname, 'test-import.csv')
    fs.writeFileSync(tmpFile, csvContent)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Should advance to mapping step
    await expect(page.getByText('Mapear Colunas')).toBeVisible()
    await expect(page.getByText(/2 linhas/)).toBeVisible()

    fs.unlinkSync(tmpFile)
  })

  test('auto-detects column mappings and enables preview button', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()

    const csvContent = createCSVContent([
      ['name', 'quantity', 'cost', 'unit', 'supplier'],
      ['Manteiga', '500', '15.90', 'g', 'Fornecedor X'],
    ])

    const tmpFile = path.join(__dirname, 'test-automap.csv')
    fs.writeFileSync(tmpFile, csvContent)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Should be on mapping step with auto-detected mappings
    await expect(page.getByText('Mapear Colunas')).toBeVisible()

    // The "Pré-visualizar" button should be enabled (all required fields mapped)
    await expect(page.getByRole('button', { name: /pré-visualizar/i })).toBeEnabled()

    fs.unlinkSync(tmpFile)
  })

  test('shows preview step with data validation', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()

    const csvContent = createCSVContent([
      ['name', 'quantity', 'cost', 'unit'],
      ['Manteiga', '500', '15.90', 'g'],
      ['Chocolate', '1000', '32.50', 'g'],
    ])

    const tmpFile = path.join(__dirname, 'test-preview.csv')
    fs.writeFileSync(tmpFile, csvContent)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Advance to preview
    await page.getByRole('button', { name: /pré-visualizar/i }).click()

    // Should show preview title
    await expect(page.getByText('Pré-visualização')).toBeVisible()
    // Should show validation counts
    await expect(page.getByText('2 válidos', { exact: true })).toBeVisible()
    // Should show data in table
    await expect(page.getByText('Manteiga')).toBeVisible()
    await expect(page.getByText('Chocolate')).toBeVisible()

    fs.unlinkSync(tmpFile)
  })

  test('completes full import flow and shows success report', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()

    const csvContent = createCSVContent([
      ['name', 'quantity', 'cost', 'unit'],
      ['Manteiga', '500', '15.90', 'g'],
      ['Chocolate', '1000', '32.50', 'g'],
      ['Farinha de Trigo', '1000', '5.50', 'g'],
    ])

    const tmpFile = path.join(__dirname, 'test-full.csv')
    fs.writeFileSync(tmpFile, csvContent)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Mapping → Preview
    await page.getByRole('button', { name: /pré-visualizar/i }).click()
    // Preview → Import
    await page.getByRole('button', { name: /importar.*ingredientes/i }).click()

    // Should show completion report
    await expect(page.getByRole('heading', { name: 'Importação Concluída' })).toBeVisible()
    // Should show Criados count
    await expect(page.getByText('Criados', { exact: true })).toBeVisible()
    // Should show Fechar button
    await expect(page.getByRole('button', { name: /fechar/i })).toBeVisible()

    fs.unlinkSync(tmpFile)
  })

  test('back button navigates from mapping to upload step', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()

    const csvContent = createCSVContent([
      ['name', 'quantity', 'cost', 'unit'],
      ['Manteiga', '500', '15.90', 'g'],
    ])

    const tmpFile = path.join(__dirname, 'test-back.csv')
    fs.writeFileSync(tmpFile, csvContent)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Should be on mapping step
    await expect(page.getByText('Mapear Colunas')).toBeVisible()

    // Go back
    await page.getByRole('button', { name: /voltar/i }).click()

    // Should be back on upload step
    await expect(page.getByText('Importar Ingredientes via CSV')).toBeVisible()
    await expect(page.getByText(/arraste um arquivo csv/i)).toBeVisible()

    fs.unlinkSync(tmpFile)
  })

  test('shows error toast for empty CSV file', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()

    // Create a CSV with only a header but no data
    const tmpFile = path.join(__dirname, 'test-empty.csv')
    fs.writeFileSync(tmpFile, 'name,quantity,cost,unit\n')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Should show toast error (sonner renders in a list element)
    await expect(page.getByText(/csv vazio/i)).toBeVisible({ timeout: 5000 })

    fs.unlinkSync(tmpFile)
  })

  test('shows duplicate handling options in preview', async ({ page }) => {
    await page.goto('/ingredients')
    await page.getByRole('button', { name: /importar csv/i }).click()

    const csvContent = createCSVContent([
      ['name', 'quantity', 'cost', 'unit'],
      ['Manteiga', '500', '15.90', 'g'],
    ])

    const tmpFile = path.join(__dirname, 'test-dups.csv')
    fs.writeFileSync(tmpFile, csvContent)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    await page.getByRole('button', { name: /pré-visualizar/i }).click()

    // Should show duplicate handling options
    await expect(page.getByText('Duplicados:')).toBeVisible()
    await expect(page.getByText('Ignorar existentes')).toBeVisible()

    fs.unlinkSync(tmpFile)
  })
})
