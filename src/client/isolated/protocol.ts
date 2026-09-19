/** Only view navigation and geometry cross the boundary; no plugin business payloads. */
export const CHANNEL = 'dsh-independent-main-view/v1'
export interface ViewIdentity { id: string; nonce: string }
export interface Geometry { left: number; width: number; sidebar: number; bottom?: number; active: boolean }
export interface ViewSummary { id: string; sessionId: string | null; active: boolean }
export interface SidebarChrome { panelOpen: boolean; bottomOpen: boolean; width: number; bottomHeight: number }
export type Command =
  | { type: 'sidebar-chrome'; value: SidebarChrome; revision: number; active: boolean }
  | { type: 'navigate'; revision: number; sessionId: string | null }
  | { type: 'geometry'; value: Geometry }
  | { type: 'views'; items: ViewSummary[] }
export type Notice =
  | { type: 'ready' }
  | { type: 'focus' }
  | { type: 'selection'; revision: number; sessionId: string | null }
  | { type: 'sidebar'; value: SidebarChrome; revision: number; sessionId: string | null }
  | { type: 'manage'; action: 'add' | 'close' | 'focus'; id?: string }
  | { type: 'error'; message: string }
export type Envelope = ViewIdentity & { channel: typeof CHANNEL; body: Command | Notice }
export function envelope(identity: ViewIdentity, body: Command | Notice): Envelope {
  return { ...identity, channel: CHANNEL, body }
}
export function accepts(event: Pick<MessageEvent, 'origin' | 'source' | 'data'>, origin: string, source: Window, identity: ViewIdentity): event is MessageEvent<Envelope> {
  const data = event.data as Partial<Envelope> | null
  return event.origin === origin && event.source === source && !!data && data.channel === CHANNEL
    && data.id === identity.id && data.nonce === identity.nonce && typeof data.body === 'object' && data.body !== null
}
export function childIdentity(url: URL): ViewIdentity | null {
  const id = url.searchParams.get('dshMainView'), nonce = url.searchParams.get('dshViewChannel')
  return id && nonce && /^[\w-]{1,80}$/.test(id) && /^[\w-]{1,80}$/.test(nonce) ? { id, nonce } : null
}
export function frameUrl(location: Pick<Location, 'origin' | 'pathname'>, identity: ViewIdentity): string {
  // Same-origin cookies authenticate the child. Never copy login queries or fragments.
  const url = new URL(location.pathname, location.origin)
  url.searchParams.set('dshMainView', identity.id)
  url.searchParams.set('dshViewChannel', identity.nonce)
  return url.href
}
export function viewGeometry(totalWidth: number, requestedSidebar: number, count: number, ratio: number) {
  const sidebar = Math.max(0, Math.min(requestedSidebar, totalWidth * .45))
  const center = Math.max(0, totalWidth - sidebar)
  const split = count > 1
  const first = split ? Math.max(0, (center - 5) * Math.max(.2, Math.min(.8, ratio))) : center
  return { sidebar, center, first, secondLeft: first + 5, second: Math.max(0, center - first - 5) }
}
export function clipRegions(left: number, width: number, height: number, total: number, sidebar: number, bottom = 0): string {
  const rect = (x: number, w: number, y = 0, h = height - bottom) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`
  return `path("${rect(left, width)}${sidebar > 0 ? rect(total - sidebar, sidebar, 0, height) : ''}${bottom > 0 ? rect(0, total - sidebar, height - bottom, bottom) : ''}")`
}
