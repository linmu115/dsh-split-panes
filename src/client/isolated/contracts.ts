import type { ReactNode } from 'react'
/** Structural public service faces; no value import from other DSH plugins. */
export interface Sessions {
  list: { getSnapshot(): { current?: string; phase?: string; byId?: Record<string, { displayTitle?: string }> }; subscribe(fn: () => void): () => void }
  open(id: string): void
  clear(): void
  refresh(): Promise<void>
}
export interface Sidebar {
  registerTab(tab: { id: string; title: string; single: boolean; order: number; component: () => ReactNode }): () => void
  getSnapshot(): { sessionId?: string | null; state?: { panelOpen?: boolean; bottomOpen?: boolean; width?: number; bottomHeight?: number } }
  subscribeState(fn: () => void): () => void
}
export interface ClientContext {
  get(name: string): unknown
  effect(body: () => () => void, label?: string): unknown
  inject(names: string[], callback: (ctx: ClientContext) => void | (() => void)): unknown
  slots: { inject(name: string, callback: () => (() => void)): unknown; register(options: Record<string, unknown>, component: unknown): () => void }
}
