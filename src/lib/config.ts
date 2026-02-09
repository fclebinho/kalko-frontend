// Runtime configuration loader
// Busca as variáveis de ambiente do servidor em runtime via API

export interface RuntimeConfig {
  clerkPublishableKey: string
  apiUrl: string
  stripePublishableKey: string
}

let cachedConfig: RuntimeConfig | null = null

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  // Retornar cache se já carregado
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // Se estamos no servidor, ler diretamente do process.env
    if (typeof window === 'undefined') {
      cachedConfig = {
        clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
        apiUrl: '/api',
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      }
      return cachedConfig
    }

    // No cliente, fazer fetch do endpoint de config
    const response = await fetch('/api/config')
    if (!response.ok) {
      throw new Error('Failed to load runtime config')
    }

    cachedConfig = await response.json()
    return cachedConfig!
  } catch (error) {
    console.error('Error loading runtime config:', error)

    // Fallback para variáveis de build (se existirem)
    cachedConfig = {
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      apiUrl: '/api',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    }

    return cachedConfig
  }
}

// Helper para uso síncrono (usa cache ou valores padrão)
export function getConfig(): RuntimeConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  // Valores padrão se ainda não carregado
  return {
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    apiUrl: '/api',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  }
}
