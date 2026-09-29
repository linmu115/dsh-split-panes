import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/isolated.spec.ts', 'tests/child-navigation.spec.ts', 'tests/dsh02-navigation.spec.ts', 'tests/sidebar-chrome.spec.ts', 'tests/onboarding-owner.spec.tsx'], environment: 'jsdom' } })

