export interface BackoffOptions {
  baseMs?: number
  maxMs?: number
}

/**
 * Computes an exponential-backoff delay (in milliseconds) for a retry attempt.
 * The delay is `baseMs * 2 ** attempt`, capped at `maxMs`, with jitter added to
 * avoid the thundering-herd problem when many clients reconnect at once.
 *
 * @param attempt - Zero-based retry attempt number.
 * @param options - `baseMs` (default 1000) and `maxMs` (cap, default 15000).
 * @returns The delay to wait before the next attempt, in milliseconds.
 */
export function backoffDelay(
  attempt: number,
  options: BackoffOptions = {},
): number {
  const { baseMs = 1000, maxMs = 15_000 } = options
  const exponential = Math.min(baseMs * 2 ** attempt, maxMs)
  const half = exponential / 2
  return half + Math.random() * half
}
