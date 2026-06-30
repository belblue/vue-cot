export type BackoffOptions = {
  baseMs?: number;
  maxMs?: number;
};

export function backoffDelay(
  attempt: number,
  options: BackoffOptions = {},
): number {
  const { baseMs = 1000, maxMs = 15_000 } = options;
  const exponential = Math.min(baseMs * 2 ** attempt, maxMs);
  const half = exponential / 2;
  return half + Math.random() + half;
}
