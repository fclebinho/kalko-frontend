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
  createdAt: string
  updatedAt: string
}

export interface Recipe {
  id: string
  name: string
  description?: string
  prepTime: number
  yield: number
  yieldUnit?: string
  totalCost?: number
  unitCost?: number
  suggestedPrice?: number
  sellingPrice?: number
  margin?: number
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
  }
  recentRecipes: Recipe[]
  mostProfitable: Recipe[]
  alerts: Array<{
    type: string
    message: string
    recipeId?: string
  }>
}

// API Methods - Ingredients
export const ingredientsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: Ingredient[]; pagination: any }>('/ingredients', { params }),

  get: (id: string) =>
    api.get<Ingredient>(`/ingredients/${id}`),

  create: (data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt' | 'costPerUnit'>) =>
    api.post<Ingredient>('/ingredients', data),

  update: (id: string, data: Partial<Ingredient>) =>
    api.put<Ingredient>(`/ingredients/${id}`, data),

  delete: (id: string) =>
    api.delete(`/ingredients/${id}`)
}

// API Methods - Recipes
export const recipesApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: Recipe[]; pagination: any }>('/recipes', { params }),

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

  delete: (id: string) =>
    api.delete(`/recipes/${id}`)
}

// API Methods - Costs
export const costsApi = {
  getSettings: () =>
    api.get<CostsSettings>('/costs/settings'),

  updateHours: (monthlyHours: number) =>
    api.put('/costs/hours', { monthlyHours }),

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

export interface Subscription {
  plan: string
  status: string
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  stripePriceId: string | null
  planInfo: Plan
}

export const billingApi = {
  // Obter subscription atual
  getSubscription: () =>
    api.get<Subscription>('/billing/subscription'),

  // Listar todos os planos
  getPlans: () =>
    api.get<{ plans: Plan[] }>('/billing/plans'),

  // Criar sessão de checkout
  createCheckout: (plan: string) =>
    api.post<{ url: string }>('/billing/create-checkout', { plan }),

  // Abrir customer portal
  getPortalUrl: () =>
    api.get<{ url: string }>('/billing/portal'),

  // Cancelar assinatura
  cancelSubscription: () =>
    api.post<{ success: boolean }>('/billing/cancel'),
}
