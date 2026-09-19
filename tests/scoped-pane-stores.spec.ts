import { describe, expect, it, vi } from 'vitest'
import { createPaneStores } from '../src/client/scoped-pane-stores.ts'

function handle() {
  return Object.freeze({ create: vi.fn((key?: string) => ({
    actions: {}, getSnapshot: () => key, subscribe: () => () => {}, clearPersisted: vi.fn(),
  })) })
}

describe('plugin-owned stores', () => {
  it('keeps a pane session stable without patching the host factory', () => {
    const stores = createPaneStores(), h = handle(), factory = h.create
    const a = stores.resolve(h, 'a')
    expect(stores.resolve(h, 'a')).toBe(a)
    expect(stores.resolve(h, 'b')).not.toBe(a)
    expect(h.create).toBe(factory)
    expect(h.create('a')).not.toBe(a)
    expect(Reflect.ownKeys(h)).toEqual(['create'])
  })
  it('does not share caches across plugin loads or mutate persisted data on disposal', () => {
    const first = createPaneStores(), second = createPaneStores(), h = handle()
    const before = first.resolve(h, 'a')
    expect(second.resolve(h, 'a')).not.toBe(before)
    first.clear()
    expect(first.resolve(h, 'a')).not.toBe(before)
    expect(h.create.mock.results[0]!.value.clearPersisted).not.toHaveBeenCalled()
  })
})
