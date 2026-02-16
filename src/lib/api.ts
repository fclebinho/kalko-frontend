import axios, { InternalAxiosRequestConfig } from 'axios'

// In production, use /api proxy (browser and server)
// In development, use localhost:3001 directly
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api'
  }
  return 'http://localhost:3001'
}

const API_URL = getApiUrl()

// Variable to store the token getter function
let getTokenFunction: (() => Promise<string | null>) | null = null

// Function to set the token getter (called by useInitializeApi hook)
export function setTokenGetter(getter: () => Promise<string | null>) {
  getTokenFunction = getter
}

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
})

// Add auth interceptor with Clerk
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Try to get token from Clerk
      if (getTokenFunction) {
        const token = await getTokenFunction()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          return config
        }
      }

      // Fallback to dev token if no Clerk token
      config.headers.Authorization = `Bearer token-dev`
      return config
    } catch (error) {
      console.error('Error getting token:', error)
      config.headers.Authorization = `Bearer token-dev`
      return config
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in'
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface Ingredient {
  id: string
  name: string
  quantity: number
  cost: number
  unit: string
  supplier?: string
  costPerUnit: number
  usedInRecipes?: number
  createdAt: string
  updatedAt: string
}

export interface Recipe {
  id: string
  name: string
  description?: string
  category?: string // Categoria da receita (bolo, torta, doce, etc)
  prepTime: number
  cookingTime?: number // Tempo de cozimento em minutos
  instructions?: string // Modo de preparo detalhado
  // Professional fields (Phase 2)
  equipment?: string[] // Equipamentos necessários
  difficulty?: 'facil' | 'medio' | 'dificil' // Nível de dificuldade
  notes?: string // Notas adicionais
  storage?: string // Condições de armazenamento
  tips?: string // Dicas profissionais
  shelfLife?: number // Tempo de validade em dias
  // Recipe data
  yield: number
  yieldUnit?: string
  totalCost?: number
  unitCost?: number
  pricingCost?: number // Custo para exibição (backend decide baseado em yieldUnit)
  suggestedPrice?: number
  sellingPrice?: number
  margin?: number
  profit?: number // Lucro bruto (sellingPrice - pricingCost), calculado pelo backend
  taxAmount?: number // Valor do imposto sobre o preço de venda
  netProfit?: number // Lucro líquido (profit - taxAmount)
  taxRate?: number // Taxa de imposto aplicada
  includeLaborAsSubRecipe?: boolean // Se false, apenas ingredientes contam quando usada como sub-receita
  calculationStatus: 'idle' | 'pending' | 'calculating' | 'completed' | 'error'
  lastCalculatedAt?: string
  createdAt: string
  updatedAt: string
  ingredients?: RecipeIngredient[]
}

export interface RecipeIngredient {
  id: string
  ingredientId?: string
  subRecipeId?: string
  quantity: number
  calculatedCost?: number
  ingredient?: Ingredient
  subRecipe?: { id: string; name: string; unitCost?: number; yield: number; yieldUnit?: string }
}

export interface FixedCost {
  id: string
  name: string
  amount: number
  month: string
}

export interface VariableCost {
  id: string
  name: string
  amount: number
  month: string
}

export interface CostsSettings {
  monthlyHours: number
  taxRate: number
  costPerMinute: number
  costPerHour: number
  fixedCosts: {
    total: number
    items: FixedCost[]
  }
  variableCosts: {
    total: number
    items: VariableCost[]
  }
  totalCosts: number
  updatedAt?: string
}

export interface DashboardData {
  summary: {
    totalRecipes: number
    totalIngredients: number
    monthlyCosts: number
    costPerMinute: number
    recipesWithLoss: number
  }
  recentRecipes: Recipe[]
  mostProfitable: Recipe[]
  alerts: Array<{
    type: string
    message: string
    recipeId?: string
  }>
}

// Types - Price History
export interface PriceHistoryEntry {
  id: string
  entityType: string
  entityId: string
  field: string
  oldValue: number
  newValue: number
  createdAt: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Types - Notifications
export interface AppNotification {
  id: string
  userId: string
  type: string // 'price_increase' | 'system'
  title: string
  message: string
  data: {
    ingredientName?: string
    oldCost?: number
    newCost?: number
    percentageChange?: number
    affectedRecipes?: Array<{
      id: string
      name: string
      quantityUsed: number
      oldIngredientCost: number
      newIngredientCost: number
      oldUnitCost: number
      newUnitCost: number
    }>
  } | null
  read: boolean
  createdAt: string
}

// Types - History Comparison & Trend
export interface HistoryComparison {
  current: number
  threeMonthsAgo: number
  change: number
  percentageChange: number
}

export interface HistoryTrend {
  trend: 'up' | 'down' | 'stable'
  projections: Array<{ date: string; value: number }>
}

// API Methods - History
export const historyApi = {
  getHistory: (entityType: string, entityId: string, field?: string) =>
    api.get<{ data: PriceHistoryEntry[] }>(`/history/${entityType}/${entityId}`, {
      params: field ? { field } : undefined,
    }),

  getComparison: (entityType: string, entityId: string, field?: string) =>
    api.get<HistoryComparison>(`/history/${entityType}/${entityId}/comparison`, {
      params: field ? { field } : undefined,
    }),

  getTrend: (entityType: string, entityId: string, field?: string) =>
    api.get<HistoryTrend>(`/history/${entityType}/${entityId}/trend`, {
      params: field ? { field } : undefined,
    }),
}

// API Methods - Notifications
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: AppNotification[]; pagination: PaginationInfo; unreadCount: number }>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put('/notifications/read-all'),
}

// Types - Bulk Import
export interface BulkImportReport {
  report: {
    total: number
    created: number
    updated: number
    skipped: number
  }
  details: {
    created: Array<{ name: string; id: string }>
    updated: Array<{ name: string; id: string }>
    skipped: Array<{ name: string; reason: string }>
  }
}

// API Methods - Ingredients
export const ingredientsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: Ingredient[]; pagination: PaginationInfo }>('/ingredients', { params }),

  get: (id: string) =>
    api.get<Ingredient>(`/ingredients/${id}`),

  create: (data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt' | 'costPerUnit'>) =>
    api.post<Ingredient>('/ingredients', data),

  update: (id: string, data: Partial<Ingredient>) =>
    api.put<Ingredient>(`/ingredients/${id}`, data),

  delete: (id: string) =>
    api.delete(`/ingredients/${id}`),

  bulkCreate: (data: {
    ingredients: Array<{ name: string; quantity: number; cost: number; unit: string; category?: string; supplier?: string }>
    onDuplicate: 'skip' | 'update'
  }) => api.post<BulkImportReport>('/ingredients/bulk', data),
}

// API Methods - Recipes
export const recipesApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: Recipe[]; pagination: PaginationInfo }>('/recipes', { params }),

  get: (id: string) =>
    api.get<Recipe>(`/recipes/${id}`),

  create: (data: any) =>
    api.post<Recipe>('/recipes', data),

  update: (id: string, data: any) =>
    api.put<Recipe>(`/recipes/${id}`, data),

  updatePrice: (id: string, sellingPrice: number) =>
    api.put(`/recipes/${id}/price`, { sellingPrice }),

  getCostBreakdown: (id: string) =>
    api.get(`/recipes/${id}/cost-breakdown`),

  getUsedIn: (id: string) =>
    api.get<{ data: Array<{ id: string; name: string }> }>(`/recipes/${id}/used-in`),

  duplicate: (id: string) =>
    api.post<Recipe>(`/recipes/${id}/duplicate`),

  recalculateAll: () =>
    api.post<{ message: string; count: number; recipes: Array<{ id: string; name: string; unitCost: number; totalCost: number }> }>('/recipes/recalculate-all'),

  calculatePrice: (data: {
    unitCost: number
    margin?: number
    profit?: number
  }) =>
    api.post<{ unitCost: number; sellingPrice: number; profit: number; margin: number }>('/recipes/calculate-price', data),

  recalculationStatus: () =>
    api.get<{
      pending: number
      calculating?: number
      error?: number
      total?: number
      recipes?: Array<{
        id: string
        name: string
        status: 'pending' | 'calculating' | 'error'
        lastCalculatedAt: string | null
      }>
      recipeIds: string[]
    }>('/recipes/recalculation/status'),

  delete: (id: string) =>
    api.delete(`/recipes/${id}`)
}

// API Methods - Costs
export const costsApi = {
  getSettings: () =>
    api.get<CostsSettings>('/costs/settings'),

  updateHours: (data: { monthlyHours?: number; taxRate?: number }) =>
    api.put('/costs/hours', data),

  createFixedCost: (data: { name: string; amount: number; month: string }) =>
    api.post<FixedCost>('/costs/fixed', data),

  updateFixedCost: (id: string, amount: number) =>
    api.put<FixedCost>(`/costs/fixed/${id}`, { amount }),

  deleteFixedCost: (id: string) =>
    api.delete(`/costs/fixed/${id}`),

  createVariableCost: (data: { name: string; amount: number; month: string }) =>
    api.post<VariableCost>('/costs/variable', data),

  updateVariableCost: (id: string, amount: number) =>
    api.put<VariableCost>(`/costs/variable/${id}`, { amount }),

  deleteVariableCost: (id: string) =>
    api.delete(`/costs/variable/${id}`),
}

// API Methods - Dashboard
export const dashboardApi = {
  get: () =>
    api.get<DashboardData>('/dashboard')
}

// Types - Analytics
export interface TopIngredient {
  ingredientId: string
  name: string
  unit: string
  totalCost: number
  recipeCount: number
  percentage: number
  recipes: Array<{ id: string; name: string; cost: number }>
}

// API Methods - Analytics
export const analyticsApi = {
  getTopIngredients: () =>
    api.get<{ data: TopIngredient[] }>('/analytics/top-ingredients'),
}

// API Methods - Billing
export interface Plan {
  id: string
  name: string
  price: number
  description: string
  limits: {
    recipes: number
    ingredients: number
    features: string[]
  }
  features: string[]
  stripePriceId?: string
}

export interface UsageInfo {
  current: number
  limit: number
}

export interface Subscription {
  plan: string
  status: string
  paymentGateway: 'stripe' | 'abacatepay'
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  stripePriceId: string | null
  abacatepayCustomerId: string | null
  abacatepayBillingId: string | null
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
  planInfo: Plan
  featureSlugs: string[]
  usage: {
    recipes: UsageInfo
    ingredients: UsageInfo
  }
}

export const billingApi = {
  // Obter subscription atual
  getSubscription: () =>
    api.get<Subscription>('/billing/subscription'),

  // Listar todos os planos
  getPlans: () =>
    api.get<{ plans: Plan[] }>('/billing/plans'),

  // Criar sessão de checkout
  createCheckout: (plan: string, gateway: 'stripe' | 'abacatepay' = 'stripe') =>
    api.post<{ url: string }>('/billing/create-checkout', { plan, gateway }),

  // Abrir customer portal
  getPortalUrl: () =>
    api.get<{ url: string }>('/billing/portal'),

  // Cancelar assinatura
  cancelSubscription: (feedback?: string) =>
    api.post<{ success: boolean; message: string; cancelAt?: string }>('/billing/cancel', { feedback }),

  // Reativar assinatura
  reactivateSubscription: () =>
    api.post<{ success: boolean; message: string }>('/billing/reactivate'),
}

// Types - Settings
export interface EmailPreferences {
  id: string
  priceAlerts: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkSettings {
  id: string
  userId: string
  monthlyHours: number
  taxRate: number
  costPerMinute: number | null
  createdAt: string
  updatedAt: string
}

// API Methods - Settings
export const settingsApi = {
  getEmailPreferences: () =>
    api.get<EmailPreferences>('/settings/email-preferences'),

  updateEmailPreferences: (data: { priceAlerts: boolean }) =>
    api.put<EmailPreferences>('/settings/email-preferences', data),

  getWorkSettings: () =>
    api.get<WorkSettings>('/settings/work'),

  updateWorkSettings: (data: { monthlyHours?: number; taxRate?: number }) =>
    api.put<WorkSettings>('/settings/work', data),
}

// API Methods - Orders
export interface OrderItem {
  recipeId: string
  quantity: number
  unitCost: number
  sellingPrice: number
}

export interface OrderCalculation {
  items: Array<OrderItem & {
    totalCost: number
    totalPrice: number
    totalProfit: number
  }>
  subtotalCost: number
  subtotalPrice: number
  discountAmount: number
  totalCost: number
  totalPrice: number
  totalProfit: number
  margin: number
}

export const ordersApi = {
  calculate: (data: {
    items: OrderItem[]
    discountType?: 'percentage' | 'fixed'
    discountValue?: number
  }) =>
    api.post<OrderCalculation>('/orders/calculate', data)
}

// Types - Admin
export interface AdminFeature {
  id: string
  slug: string
  name: string
  description?: string | null
  category?: string | null
  icon?: string | null
  isActive: boolean
  sortOrder: number
  planFeatures?: Array<{ planType: string; displayText?: string | null; sortOrder: number }>
  createdAt: string
  updatedAt: string
}

export interface AdminPlanFeatureEntry {
  featureId: string
  displayText?: string
  sortOrder?: number
}

export interface AdminPlan {
  id: string
  name: string
  price: number
  description: string
  limits: { recipes: number; ingredients: number }
  features: Array<{
    id: string
    featureId: string
    slug: string
    name: string
    displayText: string | null
    sortOrder: number
    icon: string | null
    isActive: boolean
  }>
}

// API Methods - Admin
export const adminApi = {
  checkAdmin: () =>
    api.get<{ isAdmin: boolean }>('/management/check'),

  // Features CRUD
  getFeatures: () =>
    api.get<{ data: AdminFeature[] }>('/management/features'),

  getFeature: (id: string) =>
    api.get<AdminFeature>(`/admin/features/${id}`),

  createFeature: (data: { slug: string; name: string; description?: string; category?: string; icon?: string; isActive?: boolean; sortOrder?: number }) =>
    api.post<AdminFeature>('/management/features', data),

  updateFeature: (id: string, data: Partial<AdminFeature>) =>
    api.put<AdminFeature>(`/admin/features/${id}`, data),

  deleteFeature: (id: string) =>
    api.delete(`/admin/features/${id}`),

  // Plan-Feature Management
  getPlans: () =>
    api.get<{ plans: AdminPlan[] }>('/management/plans'),

  getPlanFeatures: (planType: string) =>
    api.get<{ data: Array<{ id: string; featureId: string; slug: string; name: string; displayText: string | null; sortOrder: number }> }>(`/admin/plans/${planType}/features`),

  setPlanFeatures: (planType: string, features: AdminPlanFeatureEntry[]) =>
    api.put(`/admin/plans/${planType}/features`, { features }),
}
