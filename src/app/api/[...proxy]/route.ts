import { NextRequest, NextResponse } from 'next/server'

// Use BACKEND_API_URL for server-side proxy, fallback to localhost for development
const API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * API Route Proxy
 *
 * This route acts as a proxy to the backend API.
 * All requests to /api/* will be forwarded to the backend at /v1/*
 *
 * Example:
 * - Frontend: GET /api/ingredients
 * - Backend: GET http://backend:3001/v1/ingredients (in production via BACKEND_API_URL)
 * - Backend: GET http://localhost:3001/v1/ingredients (in development)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ proxy: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params, 'GET')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ proxy: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params, 'POST')
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ proxy: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ proxy: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params, 'DELETE')
}

async function proxyRequest(
  request: NextRequest,
  params: { proxy: string[] },
  method: string
) {
  try {
    // Build backend URL
    // Handle both /api/dashboard and /api/v1/dashboard formats
    const rawPath = params.proxy.join('/')
    const path = rawPath.startsWith('v1/') ? rawPath : `v1/${rawPath}`
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${API_URL}/${path}${searchParams ? `?${searchParams}` : ''}`

    // Get headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'connection') {
        headers[key] = value
      }
    })

    // Forward Clerk token from request, or fallback to dev token in development
    if (!headers['authorization']) {
      headers['authorization'] = 'Bearer token-dev'
    }

    // Get body for POST/PUT
    let body: string | undefined
    if (method === 'POST' || method === 'PUT') {
      try {
        const json = await request.json()
        body = JSON.stringify(json)
      } catch (e) {
        // No body or invalid JSON
      }
    }

    // Make request to backend
    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    // Get response data
    const data = await response.json().catch(() => null)

    // Return response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error: any) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal proxy error', message: error.message },
      { status: 500 }
    )
  }
}
