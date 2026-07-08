import { onScopeDispose, ref } from 'vue'

export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed'

/**
 * Reactive wrapper around a single browser `WebSocket`. Opens the connection
 * immediately and exposes its live status and last received message. Does not
 * reconnect — see {@link useReconnectingWebSocket} for that.
 *
 * The socket is closed automatically when the surrounding reactive scope is disposed.
 *
 * @param url - WebSocket URL to connect to, e.g. `wss://tak.example/cot`.
 * @returns `status` (reactive connection state), `data` (latest string message
 * or `null`) and `send` (sends a payload only while the socket is open).
 *
 * @example
 * ```ts
 * const { status, data } = useWebSocket('wss://tak.example/cot')
 * ```
 */
export function useWebSocket(url: string) {
  const status = ref<WebSocketStatus>('closed')
  const data = ref<string | null>(null)

  const ws = new WebSocket(url)
  status.value = 'connecting'

  ws.onopen = () => {
    status.value = 'open'
  }
  ws.onmessage = (event: MessageEvent) => {
    if (typeof event.data === 'string') {
      data.value = event.data
    }
  }
  ws.onclose = () => {
    status.value = 'closed'
  }
  ws.onerror = () => {
    console.error('[useWebSocket] connection error')
  }

  function send(payload: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    }
  }

  onScopeDispose(() => {
    ws.close()
  })

  return { status, data, send }
}
