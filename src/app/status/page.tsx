import { getRuntimeConfig } from '@/lib/config'

export default async function StatusPage() {
  const config = await getRuntimeConfig()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          System Status
        </h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Runtime Configuration
          </h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">API URL:</dt>
              <dd className="font-mono text-sm text-gray-900">{config.apiUrl}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Clerk Key:</dt>
              <dd className="font-mono text-sm text-gray-900">
                {config.clerkPublishableKey.substring(0, 20)}...
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Stripe Key:</dt>
              <dd className="font-mono text-sm text-gray-900">
                {config.stripePublishableKey ?
                  `${config.stripePublishableKey.substring(0, 20)}...` :
                  'Not configured'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Environment
          </h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Node Environment:</dt>
              <dd className="font-mono text-sm text-gray-900">
                {process.env.NODE_ENV}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Configuration Source:</dt>
              <dd className="font-mono text-sm text-gray-900">Runtime</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          ✅ All configurations loaded from runtime (Kubernetes ConfigMap/Secrets)
        </div>
      </div>
    </div>
  )
}
