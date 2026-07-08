import { onScopeDispose, watch } from 'vue'
import { useReconnectingWebSocket } from './use-reconnecting-websocket'

export interface TakConnectionOptions {
  pingIntervalMs?: number
  pingTimeoutMs?: number
  onConnect?: () => void
  onMessage?: (cot: string) => void
  onDisconnect?: () => void
  onError?: () => void
}

/**
 * Application-level TAK connection on top of {@link useReconnectingWebSocket}.
 * Adds ping keepalive, zombie-connection detection (forces a reconnect when no
 * traffic is seen within `pingTimeoutMs`) and newline-delimited message framing,
 * so `onMessage` fires once per whole CoT message.
 *
 * @param url - WebSocket URL of the TAK/CoT feed.
 * @param options - Lifecycle hooks (`onConnect`, `onMessage`, `onDisconnect`,
 * `onError`) plus `pingIntervalMs` (default 15000) and `pingTimeoutMs` (default 30000).
 * @returns Reactive `status`, `data`, `attempts` and the `reconnect`, `close`, `send` controls.
 */
export function useTakConnection(
  url: string,
  options: TakConnectionOptions = {},
) {
  const connection = useReconnectingWebSocket(url)
  const { status, data, attempts, close, reconnect, send } = connection
  const { pingIntervalMs = 15_000, pingTimeoutMs = 30_000 } = options
  let lastSeen = Date.now()

  watch(status, (newStatus, oldStatus) => {
    if (newStatus === 'open') {
      lastSeen = Date.now()
      options.onConnect?.()
    }
    else if (oldStatus === 'open') {
      options.onDisconnect?.()
    }
  })
  watch(data, () => {
    lastSeen = Date.now()
  })

  let buffer = ''
  watch(data, (raw) => {
    if (raw === null)
      return
    buffer += raw
    const frames = buffer.split('\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const trimmed = frame.trim()
      if (trimmed) {
        options.onMessage?.(trimmed)
      }
    }
  })

  const pingTimer = setInterval(() => {
    send('ping')
    if (Date.now() - lastSeen > pingTimeoutMs)
      reconnect()
  }, pingIntervalMs)

  onScopeDispose(() => clearInterval(pingTimer))

  return { status, data, attempts, reconnect, close, send }
}
