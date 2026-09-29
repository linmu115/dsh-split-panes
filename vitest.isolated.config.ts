import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/isolated.spec.ts', 'tests/dsh02-navigation.spec.ts', 'tests/sidebar-chrome.spec.ts'], environment: 'jsdom' } })

