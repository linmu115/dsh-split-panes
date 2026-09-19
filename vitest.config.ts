import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { realpathSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

/** DSH workspace sources: the linked packages' `./client` exports point at
    browser bundles (lib/client.js, loader-bannered) — tests must resolve to
    the workspace src instead (see tsconfig.json `paths`, which maps every
    @deepseek-ai dependency to the core checkout's sources). Vite resolves
    tsconfig paths natively (resolve.tsconfigPaths). */
const core = (process.env.DSH_HARNESS_SOURCE ?? fileURLToPath(new URL('../dsh2026/deepseek-harness', import.meta.url))).replace(/\\/g, '/')
const testRequire = createRequire(realpathSync(`${core}/node_modules/@testing-library/react/package.json`))
const rendererRequire = createRequire(`${core}/packages/client/ui-renderer/package.json`)

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    environment: 'node',
    exclude: process.env.DSH_ANNOTATION_SOURCE ? [] : ['tests/reference-compatibility.spec.tsx'],
    pool: 'threads',
  },
  resolve: {
    tsconfigPaths: true,
    // Single react across the plugin tree and the linked core sources: the
    // core packages' symlinked react would otherwise resolve to a SECOND
    // module instance (hooks dispatcher null — "Cannot read properties of
    // null (reading 'useEffect')").
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      ...(process.env.DSH_ANNOTATION_SOURCE ? { '@local-annotation': process.env.DSH_ANNOTATION_SOURCE.replace(/\\/g, '/') + '/src' } : {}),
      'react': dirname(testRequire.resolve('react/package.json')).replace(/\\/g, '/'),
      'react-dom': dirname(testRequire.resolve('react-dom/package.json')).replace(/\\/g, '/'),
      '@testing-library/react': `${core}/node_modules/@testing-library/react/dist/index.js`,
      'use-sync-external-store': dirname(rendererRequire.resolve('use-sync-external-store/package.json')).replace(/\\/g, '/'),
      // Symmetric with tsconfig.json paths (Vite reads the project tsconfig,
      // but keep the explicit form as the authoritative source).
      '@deepseek-ai/cordis': `${core}/vendor/cordis/src`,
      '@deepseek-ai/dsh-client-store': `${core}/packages/client/store/src/index.ts`,
      '@deepseek-ai/dsh-client-ui-slots': `${core}/packages/client/ui-slots/src/index.ts`,
      '@deepseek-ai/dsh-client-ui-primitives': `${core}/packages/client/ui-primitives/src/index.ts`,
      '@deepseek-ai/dsh-client-locale/client': `${core}/packages/client/locale/src/client/index.ts`,
      '@deepseek-ai/dsh-client-ui-layout/client': `${core}/packages/client/ui-layout/src/client/index.ts`,
      '@deepseek-ai/dsh-client-ui-renderer/client': `${core}/packages/client/ui-renderer/src/client/index.ts`,
      '@deepseek-ai/dsh-client-ui-session/client': `${core}/packages/client/ui-session/src/client/index.ts`,
      '@deepseek-ai/dsh-client-ui-conversation/client': `${core}/packages/client/ui-conversation/src/client/index.ts`,
      '@deepseek-ai/dsh-client-ui-chat/client': `${core}/packages/client/ui-chat/src/client/index.ts`,
      '@deepseek-ai/dsh-api-session-controller/client': `${core}/packages/api/session-controller/src/client/index.ts`,
      '@deepseek-ai/dsh-session/types': `${core}/packages/core/session/src/types.ts`,
      '@deepseek-ai/dsh-client-test-runtime': `${core}/packages/test-support/client-runtime/src/index.ts`,
      '@deepseek-ai/dsh-client-test-runtime/client': `${core}/packages/test-support/client-runtime/src/client/index.ts`,
    },
  },
})
