import ts from 'typescript'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { realpathSync, readdirSync, readFileSync } from 'node:fs'

const core = process.env.DSH_HARNESS_SOURCE
if (!core) throw new Error('Set DSH_HARNESS_SOURCE to the read-only RC2 source checkout')
const base = ts.readConfigFile(resolve(core, 'tsconfig.base.json'), ts.sys.readFile).config
const paths = Object.fromEntries(Object.entries(base.compilerOptions.paths).map(([key, values]) =>
  [key, values.map(value => resolve(core, value).replaceAll('\\', '/'))]))
// Official generated remote declarations are read from pinned release archives.
for (const folder of readdirSync('.dev/declarations', { withFileTypes: true }).filter(entry => entry.isDirectory())) {
  const packageRoot = resolve('.dev/declarations', folder.name, 'package')
  const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'))
  const remote = manifest.exports?.['./remote']?.types
  if (remote) paths[`${manifest.name}/remote`] = [resolve(packageRoot, remote)]
}
const rendererRequire = createRequire(resolve(core, 'packages/client/ui-renderer/package.json'))
const testRequire = createRequire(realpathSync(resolve(core, 'node_modules/@testing-library/react/package.json')))
paths['use-sync-external-store/*'] = [resolve(dirname(rendererRequire.resolve('@types/use-sync-external-store/package.json')), '*')]
paths['@testing-library/react'] = [resolve(core, 'node_modules/@testing-library/react/types/index.d.ts')]
paths['react'] = [resolve(dirname(testRequire.resolve('@types/react/package.json')), 'index.d.ts')]
paths['react/*'] = [resolve(dirname(testRequire.resolve('@types/react/package.json')), '*')]
const file = process.argv[2] ?? 'tsconfig.client.json'
const config = ts.readConfigFile(file, ts.sys.readFile).config
config.compilerOptions = { ...config.compilerOptions, paths }
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, process.cwd())
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true })
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
process.stdout.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: f => f, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n',
}))
process.exitCode = diagnostics.length ? 1 : 0
