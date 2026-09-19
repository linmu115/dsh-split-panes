/** Plugin-owned view stores. Never replace a host or another plugin's factory. */
import type { StoreInstanceLike } from '@deepseek-ai/dsh-client-ui-slots'

export type PaneStoreResolver = (handle: object, scopeKey: string | undefined) => StoreInstanceLike

export function createPaneStores(): { resolve: PaneStoreResolver; clear(): void } {
  let handles = new WeakMap<object, Map<string | undefined, StoreInstanceLike>>()
  return {
    resolve(handle, scopeKey) {
      let scopes = handles.get(handle)
      if (!scopes) { scopes = new Map(); handles.set(handle, scopes) }
      let instance = scopes.get(scopeKey)
      if (!instance) {
        instance = (handle as { create(key?: string): StoreInstanceLike }).create(scopeKey)
        scopes.set(scopeKey, instance)
      }
      return instance
    },
    clear() { handles = new WeakMap() },
  }
}
