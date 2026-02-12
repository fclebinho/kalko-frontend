import { Page, Route } from '@playwright/test'

// ── Mock data ────────────────────────────────────────────────

export const mockIngredients = [
  {
    id: 'ing-1',
    name: 'Farinha de Trigo',
    quantity: 1000,
    cost: 5.5,
    unit: 'g',
    costPerUnit: 0.0055,
    supplier: 'Fornecedor A',
    usedInRecipes: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ing-2',
    name: 'Açúcar',
    quantity: 1000,
    cost: 4.0,
    unit: 'g',
    costPerUnit: 0.004,
    supplier: 'Fornecedor B',
    usedInRecipes: 1,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'ing-3',
    name: 'Leite',
    quantity: 1000,
    cost: 6.0,
    unit: 'ml',
    costPerUnit: 0.006,
    supplier: 'Fornecedor C',
    usedInRecipes: 3,
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
]

export const mockRecipes = [
  {
    id: 'rec-1',
    name: 'Bolo de Chocolate',
    description: 'Bolo tradicional',
    prepTime: 60,
    yield: 1000,
    yieldUnit: 'g',
    totalCost: 25.5,
    unitCost: 0.0255,
    pricingCost: 25.5,
    suggestedPrice: 45.0,
    sellingPrice: 50.0,
    margin: 49,
    profit: 24.5,
    ingredientsCount: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ingredients: [
      {
        id: 'ri-1',
        ingredientId: 'ing-1',
        quantity: 500,
        ingredient: { id: 'ing-1', name: 'Farinha de Trigo', unit: 'g' },
      },
      {
        id: 'ri-2',
        ingredientId: 'ing-2',
        quantity: 300,
        ingredient: { id: 'ing-2', name: 'Açúcar', unit: 'g' },
      },
    ],
    calculations: {
      breakdown: {
        ingredients: [
          {
            ingredientId: 'ing-1',
            name: 'Farinha de Trigo',
            quantity: 500,
            unit: 'g',
            costPerUnit: 0.0055,
            totalCost: 2.75,
            percentage: 55,
            isSubRecipe: false,
          },
          {
            ingredientId: 'ing-2',
            name: 'Açúcar',
            quantity: 300,
            unit: 'g',
            costPerUnit: 0.004,
            totalCost: 1.2,
            percentage: 24,
            isSubRecipe: false,
          },
        ],
        ingredientsCost: 3.95,
        laborCost: 10.0,
        laborCostPercentage: 39.2,
        totalCost: 25.5,
      },
      unitCost: 0.0255,
      pricingCost: 25.5, // totalCost para peso/volume (g, kg, ml, l)
      suggestedPrice: 45.0,
      sellingPrice: 50.0,
      actualMargin: 49,
      profit: 24.5,
      mostExpensiveIngredient: {
        name: 'Farinha de Trigo',
        totalCost: 2.75,
        percentage: 55,
      },
    },
  },
  {
    id: 'rec-2',
    name: 'Brigadeiro',
    description: 'Brigadeiro gourmet',
    prepTime: 30,
    yield: 50,
    yieldUnit: 'un',
    totalCost: 15.0,
    unitCost: 0.3,
    pricingCost: 0.3,
    suggestedPrice: 2.5,
    sellingPrice: 3.0,
    margin: 80,
    profit: 2.7,
    ingredientsCount: 0,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

export const mockPriceHistory = [
  {
    id: 'ph-1',
    entityType: 'recipe',
    entityId: 'rec-1',
    field: 'unitCost',
    oldValue: 0.02,
    newValue: 0.0255,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ph-2',
    entityType: 'recipe',
    entityId: 'rec-1',
    field: 'unitCost',
    oldValue: 0.0255,
    newValue: 0.03,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'ph-3',
    entityType: 'recipe',
    entityId: 'rec-1',
    field: 'totalCost',
    oldValue: 20.0,
    newValue: 25.5,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ph-4',
    entityType: 'recipe',
    entityId: 'rec-1',
    field: 'totalCost',
    oldValue: 25.5,
    newValue: 30.0,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'ph-5',
    entityType: 'recipe',
    entityId: 'rec-1',
    field: 'sellingPrice',
    oldValue: 40.0,
    newValue: 50.0,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ph-6',
    entityType: 'recipe',
    entityId: 'rec-1',
    field: 'sellingPrice',
    oldValue: 50.0,
    newValue: 55.0,
    createdAt: '2026-01-15T00:00:00Z',
  },
]

export const mockBulkImportReport = {
  report: {
    total: 3,
    created: 2,
    updated: 1,
    skipped: 0,
  },
  details: {
    created: [
      { name: 'Manteiga', id: 'ing-new-1' },
      { name: 'Chocolate', id: 'ing-new-2' },
    ],
    updated: [{ name: 'Farinha de Trigo', id: 'ing-1' }],
    skipped: [],
  },
}

// ── Route handler ────────────────────────────────────────────

function json(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  }
}

function handleApiRoute(route: Route) {
  const url = new URL(route.request().url())
  const path = url.pathname
  const method = route.request().method()

  // Ingredients list
  if (path === '/v1/ingredients' && method === 'GET') {
    return route.fulfill(
      json({
        data: mockIngredients,
        pagination: { page: 1, limit: 50, total: mockIngredients.length, pages: 1 },
      })
    )
  }

  // Ingredients bulk import
  if (path === '/v1/ingredients/bulk' && method === 'POST') {
    return route.fulfill(json(mockBulkImportReport))
  }

  // Recipes list
  if (path === '/v1/recipes' && method === 'GET') {
    return route.fulfill(
      json({
        data: mockRecipes,
        pagination: { page: 1, limit: 50, total: mockRecipes.length, pages: 1 },
      })
    )
  }

  // Single recipe
  if (path.match(/^\/v1\/recipes\/[\w-]+$/) && method === 'GET') {
    const id = path.split('/').pop()
    const recipe = mockRecipes.find((r) => r.id === id)
    if (recipe) return route.fulfill(json(recipe))
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"Not found"}' })
  }

  // Price history - comparison
  if (path.match(/^\/v1\/history\/[\w-]+\/[\w-]+\/comparison/) && method === 'GET') {
    return route.fulfill(
      json({ current: 0.03, threeMonthsAgo: 0.02, change: 0.01, percentageChange: 50 })
    )
  }

  // Price history - trend
  if (path.match(/^\/v1\/history\/[\w-]+\/[\w-]+\/trend/) && method === 'GET') {
    return route.fulfill(
      json({
        trend: 'up',
        projections: [
          { date: '2026-02-15T00:00:00Z', value: 0.032 },
          { date: '2026-03-15T00:00:00Z', value: 0.035 },
        ],
      })
    )
  }

  // Price history - list
  if (path.match(/^\/v1\/history\//) && method === 'GET') {
    return route.fulfill(json({ data: mockPriceHistory }))
  }

  // Notifications unread count
  if (path === '/v1/notifications/unread-count' && method === 'GET') {
    return route.fulfill(json({ count: 0 }))
  }

  // Notifications list
  if (path === '/v1/notifications' && method === 'GET') {
    return route.fulfill(json({ data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }))
  }

  // Cost settings
  if (path === '/v1/costs/settings' && method === 'GET') {
    return route.fulfill(
      json({
        monthlyHours: 160,
        costPerMinute: 0.17,
        costPerHour: 10.0,
        fixedCosts: { total: 500, items: [] },
        variableCosts: { total: 200, items: [] },
        totalCosts: 700,
      })
    )
  }

  // Update hours
  if (path === '/v1/costs/hours' && method === 'PUT') {
    return route.fulfill(json({ monthlyHours: 160, costPerMinute: 0.17 }))
  }

  // Billing subscription
  if (path === '/v1/billing/subscription' && method === 'GET') {
    return route.fulfill(
      json({
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: '2026-03-01T00:00:00Z',
        stripeCustomerId: 'cus_test',
        stripePriceId: 'price_test',
        cancelAtPeriodEnd: false,
        cancelAt: null,
        planInfo: {
          id: 'pro',
          name: 'Pro',
          price: 29,
          limits: { recipes: -1, ingredients: -1 },
        },
        usage: {
          recipes: { current: 5, limit: -1 },
          ingredients: { current: 10, limit: -1 },
        },
      })
    )
  }

  // Default: return empty success
  return route.fulfill(json({}))
}

// ── Setup function ───────────────────────────────────────────

export async function setupApiMocks(page: Page) {
  // Single route handler for all API calls
  await page.route(/\/v1\//, handleApiRoute)
}

export function createCSVContent(rows: string[][]): string {
  return rows.map((row) => row.join(',')).join('\n')
}
