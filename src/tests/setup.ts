import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Global test configuration
config.global.mocks = {
  $style: new Proxy(
    {},
    {
      get: (_target, prop) => prop,
    },
  ),
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
