import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Função para criar um cliente API com token
export function createApiClient(getToken: () => Promise<string | null>) {
  const client = axios.create({
    baseURL: `${API_URL}/v1`,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Interceptor para adicionar token do Clerk
  client.interceptors.request.use(
    async (config) => {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      } else {
        // Fallback para desenvolvimento
        config.headers.Authorization = `Bearer token-dev`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token inválido ou expirado
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}
