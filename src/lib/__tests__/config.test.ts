import { getConfig } from '../config'

describe('config', () => {
  test('getConfig returns default config when no cache', () => {
    const config = getConfig()

    expect(config).toHaveProperty('clerkPublishableKey')
    expect(config).toHaveProperty('apiUrl', '/api')
    expect(config).toHaveProperty('stripePublishableKey')
  })

  test('getConfig returns consistent structure', () => {
    const config = getConfig()

    expect(typeof config.clerkPublishableKey).toBe('string')
    expect(typeof config.apiUrl).toBe('string')
    expect(typeof config.stripePublishableKey).toBe('string')
  })
})
