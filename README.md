# Frontend - Sistema de Precificação

Frontend em Next.js 14 para o sistema de gestão de custos e precificação.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Axios** - Cliente HTTP
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de dados
- **Sonner** - Notificações toast
- **Lucide React** - Ícones

## 📁 Estrutura

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/[...proxy]/     # API Routes (proxy para backend)
│   │   ├── ingredients/        # Página de ingredientes
│   │   ├── recipes/            # Página de receitas
│   │   ├── costs/              # Página de custos
│   │   ├── layout.tsx          # Layout raiz
│   │   ├── page.tsx            # Dashboard
│   │   └── globals.css         # Estilos globais
│   │
│   ├── components/
│   │   ├── ui/                 # Componentes shadcn/ui
│   │   └── navigation.tsx      # Navegação
│   │
│   └── lib/
│       ├── api.ts              # Cliente API + tipos
│       └── utils.ts            # Utilitários
│
├── public/                     # Assets estáticos
├── .env.local                  # Variáveis de ambiente
├── next.config.ts              # Configuração Next.js
├── tailwind.config.ts          # Configuração Tailwind
├── components.json             # Configuração shadcn/ui
└── package.json
```

## 🔧 Setup

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local` (já criado) e configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Rodar em Desenvolvimento

```bash
npm run dev
```

Aplicação estará em **http://localhost:3000**

## 📡 API Routes

O frontend usa Next.js API Routes como proxy para o backend:

```
Frontend → /api/* → Backend /v1/*
```

**Exemplo:**
- Frontend: `GET /api/ingredients`
- Backend: `GET http://localhost:3001/v1/ingredients`

Isso permite:
- ✅ Melhor segurança (esconde backend URL)
- ✅ Autenticação centralizada
- ✅ CORS simplificado
- ✅ Fácil mudança de backend

Arquivo: [src/app/api/[...proxy]/route.ts](src/app/api/[...proxy]/route.ts)

## 📚 Client API

O arquivo `src/lib/api.ts` contém:

- Cliente Axios configurado
- Tipos TypeScript de todas as entidades
- Métodos para todas as rotas da API
- Interceptors para autenticação

**Exemplo de uso:**

```typescript
import { ingredientsApi } from '@/lib/api'

// Listar
const response = await ingredientsApi.list({ search: 'farinha' })
const ingredients = response.data.data

// Criar
await ingredientsApi.create({
  name: 'Farinha de Trigo',
  quantity: 1000,
  cost: 5.00,
  unit: 'g'
})

// Atualizar
await ingredientsApi.update('id-123', { cost: 5.50 })

// Deletar
await ingredientsApi.delete('id-123')
```

## 🎨 Componentes UI

Usando **shadcn/ui** - biblioteca de componentes copiáveis:

```bash
# Adicionar novos componentes
npx shadcn@latest add [component-name]
```

Componentes já instalados:
- `button` - Botões
- `card` - Cards
- `input` - Inputs
- `label` - Labels
- `table` - Tabelas
- `dialog` - Modais
- `select` - Selects
- `form` - Formulários
- `alert` - Alertas
- `sonner` - Toasts

## 📄 Páginas

### Dashboard (`/`)
- Resumo de métricas
- Receitas recentes
- Produtos mais rentáveis
- Alertas de produtos com prejuízo/margem baixa

### Ingredientes (`/ingredients`)
- Listagem com busca
- Criar/editar/excluir
- Cálculo automático de custo/unidade
- Modal de formulário

### Receitas (`/recipes`)
- Listagem com busca
- Visualização de custos e margens
- Código de cores por margem
- Link para detalhes

### Custos (`/costs`)
- Configurar horas mensais
- Gerenciar custos fixos e variáveis
- Visualizar custo por minuto
- Adicionar/remover custos

## 🔐 Autenticação

**Atualmente:** Usando token de desenvolvimento (`Bearer token-dev`)

**Próximos passos:**
1. Instalar Clerk:
   ```bash
   npm install @clerk/nextjs
   ```

2. Configurar em `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. Atualizar `src/lib/api.ts` para usar token do Clerk

## 🚀 Build de Produção

```bash
# Build
npm run build

# Rodar produção
npm start

# Ou usar Vercel
vercel deploy
```

## 📦 Scripts Disponíveis

```bash
npm run dev         # Desenvolvimento
npm run build       # Build de produção
npm run start       # Rodar produção
npm run lint        # Lint
```

## 🎯 Próximas Features

- [ ] Página de detalhes da receita
- [ ] Criação/edição de receitas com ingredientes
- [ ] Calculadora de preço sugerido
- [ ] Relatórios e gráficos
- [ ] Exportação de dados (PDF/Excel)
- [ ] Autenticação com Clerk
- [ ] Perfil de usuário
- [ ] Planos e assinaturas

## 🐛 Debug

### Erro de conexão com backend

Verifique se:
1. Backend está rodando em `http://localhost:3001`
2. `.env.local` tem a URL correta
3. CORS está configurado no backend

### Componentes não renderizam

Verifique se:
1. Importou corretamente de `@/components/ui/...`
2. Instalou o componente com `npx shadcn@latest add [name]`

### Tipos TypeScript

Todos os tipos estão em `src/lib/api.ts`. Se adicionar novos campos no backend, atualize os tipos correspondentes.

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Desenvolvido com Next.js 14 + TypeScript + Tailwind CSS**
