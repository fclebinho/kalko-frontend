import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.arrayBuffer()
    const headers: Record<string, string> = {}

    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'connection') {
        headers[key] = value
      }
    })

    const response = await fetch(`${API_URL}/webhooks/abacatepay`, {
      method: 'POST',
      headers,
      body: Buffer.from(rawBody),
    })

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
    })
  } catch (error: any) {
    console.error('Webhook proxy error (abacatepay):', error.message)
    return NextResponse.json({ error: 'Webhook proxy error' }, { status: 502 })
  }
}
