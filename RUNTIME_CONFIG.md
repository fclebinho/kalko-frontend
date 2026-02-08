# Runtime Configuration

Este frontend utiliza **Runtime Configuration** ao invés de Build-Time Configuration.

## Por quê?

- ✅ **Mesma imagem para todos os ambientes** (dev, staging, prod)
- ✅ **Sem rebuild** para mudar configurações
- ✅ **Segurança** - não embutir secrets na imagem
- ✅ **Flexibilidade** - mudar configs via Kubernetes ConfigMap/Secrets

## Como funciona?

### 1. Endpoint `/api/config`

Expõe as variáveis públicas necessárias para o cliente:

```typescript
// GET /api/config
{
  "clerkPublishableKey": "pk_live_...",
  "apiUrl": "https://api.kalko.app",
  "stripePublishableKey": "pk_live_..."
}
```

### 2. Helper `getRuntimeConfig()`

Função assíncrona que carrega a configuração:

```typescript
import { getRuntimeConfig } from '@/lib/config'

// Em um componente Server
export default async function MyPage() {
  const config = await getRuntimeConfig()

  return <div>API URL: {config.apiUrl}</div>
}
```

### 3. Helper `getConfig()` (síncrono)

Para uso imediato (usa cache ou fallback):

```typescript
import { getConfig } from '@/lib/config'

// Em um componente Client
'use client'

export default function MyComponent() {
  const config = getConfig()

  return <div>Clerk Key: {config.clerkPublishableKey}</div>
}
```

## Variáveis de Ambiente

### Server-Side (sempre em runtime)

Estas variáveis são lidas do `process.env` em runtime no servidor:

```bash
# Clerk
CLERK_SECRET_KEY=sk_live_...

# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
```

### Client-Side (via endpoint /api/config)

Estas variáveis são expostas via API para o cliente:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# API
NEXT_PUBLIC_API_URL=https://api.kalko.app

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Configuração no Kubernetes

### ConfigMap (valores públicos)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
data:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_..."
  NEXT_PUBLIC_API_URL: "https://api.kalko.app"
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_..."
```

### Secret (valores sensíveis)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: frontend-secret
type: Opaque
stringData:
  CLERK_SECRET_KEY: "sk_live_..."
  STRIPE_SECRET_KEY: "sk_live_..."
```

### Deployment (injeção)

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: frontend
        envFrom:
        - configMapRef:
            name: frontend-config
        - secretRef:
            name: frontend-secret
```

## Exemplo Completo

```typescript
// src/app/page.tsx
import { getRuntimeConfig } from '@/lib/config'
import { ClerkProvider } from '@clerk/nextjs'

export default async function RootLayout({ children }) {
  const config = await getRuntimeConfig()

  return (
    <html>
      <body>
        <ClerkProvider publishableKey={config.clerkPublishableKey}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
```

## Migração

Se você estava usando diretamente `process.env.NEXT_PUBLIC_*`:

```typescript
// ❌ Antes (build-time)
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// ✅ Depois (runtime)
import { getConfig } from '@/lib/config'
const { apiUrl } = getConfig()
```

## Build da Imagem Docker

```bash
# Sem variáveis de ambiente!
docker build -t kalko-frontend .

# Mesma imagem funciona em todos os ambientes
docker run -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... kalko-frontend
```

## Cache

A configuração é cacheada após o primeiro carregamento:
- **Servidor**: Cache em memória
- **Cliente**: Cache após fetch inicial
- **HTTP**: Cache-Control com 1h de revalidação

## Troubleshooting

### Config vazio no cliente

Verifique se o endpoint `/api/config` está acessível:

```bash
curl http://localhost:3000/api/config
```

### Valores não atualizando

1. Verifique se as variáveis estão no ConfigMap/Secret
2. Reinicie o pod: `kubectl rollout restart deployment frontend`
3. Limpe o cache do browser

### Build falhando

Se o build ainda falhar por falta de variáveis, verifique:
1. `export const dynamic = 'force-dynamic'` está no layout.tsx?
2. Nenhum código está acessando `process.env.NEXT_PUBLIC_*` em build-time?
