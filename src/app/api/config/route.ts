import { NextResponse } from 'next/server'

// Endpoint para expor configurações públicas em runtime
// Isso permite que as variáveis sejam injetadas via Kubernetes ConfigMap/Secrets
// sem precisar rebuildar a imagem Docker

export async function GET() {
  const config = {
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  }

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
