import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.tsx'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/components/**', 'src/lib/**'],
      exclude: [
        'src/components/ui/**',
        'src/**/__tests__/**',
        // Complex dialog/selector components - better tested with E2E (Playwright)
        'src/components/csv-import-dialog.tsx',
        'src/components/ingredient-selector.tsx',
        'src/components/price-history-chart.tsx',
        'src/components/onboarding-wizard.tsx',
        // API module - depends on axios instance lifecycle
        'src/lib/api.ts',
        'src/lib/api-client.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
