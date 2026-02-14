# Kalko Frontend

Frontend da aplicação Kalko - Sistema de precificação para food service.

## Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Clerk
- **State**: Zustand
- **Real-time**: Socket.IO
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **PDF**: jsPDF

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test

# Lint
npm run lint
```

## Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Deploy

CI/CD automático via GitHub Actions:
- `develop` → dev.kalko.app
- `staging` → staging.kalko.app
- `main` → kalko.app

## Repositórios Relacionados

- Backend: https://github.com/fclebinho/kalko-backend
- K8s Manifests: https://github.com/fclebinho/kalko-k8s-manifests

