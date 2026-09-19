import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/isolated.spec.ts'], environment: 'jsdom' } })
