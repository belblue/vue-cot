import type { CoTEvent } from '../protocol/types'
import type { TakConnectionOptions } from './use-tak-connection'
import { ref } from 'vue'
import { parseCoT } from '../protocol/parse'
import { useTakConnection } from './use-tak-connection'

export type CoTStreamOptions = TakConnectionOptions & {
  onEvent?: (event: CoTEvent) => void
}

/**
 * High-level CoT stream: wraps {@link useTakConnection} and parses each framed
 * message into a typed {@link CoTEvent}. Prefer the lossless `onEvent` callback
 * (fired once per parsed frame) to feed a store; the reactive `event` ref only
 * ever holds the most recent message.
 *
 * @param url - WebSocket URL of the CoT feed.
 * @param options - {@link TakConnectionOptions} plus `onEvent(event)`, called
 * for every successfully parsed CoT message.
 * @returns The underlying connection controls plus reactive `event` (latest
 * parsed `CoTEvent` or `null`) and `error` (last parse error or `null`).
 *
 * @example
 * ```ts
 * const store = useEntityStore()
 * useCoTStream(url, { onEvent: (e) => store.upsert(e) })
 * ```
 */
export function useCoTStream(url: string, options: CoTStreamOptions = {}) {
  const event = ref<CoTEvent | null>(null)
  const error = ref<Error | null>(null)

  const connection = useTakConnection(url, {
    ...options,
    onMessage: (raw) => {
      try {
        const parsed = parseCoT(raw)
        event.value = parsed
        error.value = null
        options.onEvent?.(parsed)
        options.onMessage?.(raw)
      }
      catch (err) {
        error.value = err as Error
      }
    },
  })

  return { ...connection, event, error }
}
