import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/isolated.spec.ts', 'tests/sidebar-chrome.spec.ts'], environment: 'jsdom' } })
