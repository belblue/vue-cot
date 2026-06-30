# vue-cot — Tutoring Notes

A running log of every code chunk built, with line-by-line explanation. Organised by
phase. Newest entries go at the bottom of each phase.

---

## Phase 1 — WebSocket fundamentals

### `useWebSocket(url)` — the client composable

File: `packages/core/src/composables/use-websocket.ts`

```ts
import { onScopeDispose, ref } from 'vue'

export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed'

export function useWebSocket(url: string) {
  const status = ref<WebSocketStatus>('closed')
  const data = ref<string | null>(null)

  const ws = new WebSocket(url)
  status.value = 'connecting'

  ws.onopen = () => {
    status.value = 'open'
  }
  ws.onmessage = (event: MessageEvent) => {
    if (typeof event.data === 'string')
      data.value = event.data
  }
  ws.onclose = () => {
    status.value = 'closed'
  }
  ws.onerror = () => {
    console.error('[useWebSocket] connection error')
  }

  function send(payload: string) {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(payload)
  }

  onScopeDispose(() => {
    ws.close()
  })

  return { status, data, send }
}
```

**Concepts**

- **The four `readyState` values:** `0 CONNECTING`, `1 OPEN`, `2 CLOSING`, `3 CLOSED`.
  We mirror them as a typed string union (`WebSocketStatus`) so app code reads
  `'open'` instead of the magic number `1`.
- **`new WebSocket(url)` starts connecting immediately but asynchronously** — at that
  instant `readyState` is `0`, so we set `status` to `'connecting'`.
- **The four events:** `open` → connected (safe to `send`); `message` → payload on
  `event.data`; `error` → something failed; `close` → ended. On a *failed* connection,
  `onerror` fires first, then `onclose` — they come as a pair, and `onclose` is what
  resolves `status` to `'closed'`.
- **`event.data` guard:** `data` is typed `any` because a message can be a string, a
  `Blob`, or an `ArrayBuffer`. CoT is text, so we accept only `typeof === 'string'`.
- **`ref`, not `shallowRef`:** status and message are primitives. (`shallowRef` comes in
  Phase 5 for the large entity map.)
- **`send` guard:** `ws.send()` *throws* if the socket isn't `OPEN`, so we check
  `readyState === WebSocket.OPEN` first.
- **`onScopeDispose` — the heart of Phase 1.** Cleans up by calling the real
  `ws.close()`. Chosen over `onUnmounted` because `onUnmounted` only works inside a
  component's `setup`; `onScopeDispose` hooks the current *effect scope*, which exists
  in components, Pinia stores, and other composables too. Without it, every consumer
  leaks an open socket when destroyed.

**Bug caught while building:** writing `ws.close = () => {...}` instead of
`ws.onclose = ...` overwrites the real `close()` *method* with a handler — TypeScript
stays silent (it's assignable), but the socket can no longer actually close. `close` =
the method you call; `onclose` = the handler that runs when it closes.

---

### Mock TAK server

File: `packages/server/src/server.ts`. Run with `node --experimental-strip-types`
(Node 22 runs TypeScript directly — stripping types is *not* type-checking; that stays
the separate `tsc` job).

```ts
import { WebSocketServer } from 'ws'

const PORT = 8087
const wss = new WebSocketServer({ port: PORT })
console.warn(`[mock-tak] listening on ws://localhost:${PORT}`)

function makeCot(): string {
  const now = new Date()
  const stale = new Date(now.getTime() + 60_000)
  return `<event version="2.0" uid="BLUE-1" type="a-f-G-U-C-I" time="${now.toISOString()}" start="${now.toISOString()}" stale="${stale.toISOString()}"><point lat="40.4168" lon="-3.7038" hae="100" ce="5" le="10"/><detail><contact callsign="BLUE-1"/></detail></event>`
}

wss.on('connection', (socket) => {
  console.warn('[mock-tak] client connected')
  const timer = setInterval(() => socket.send(makeCot()), 1000)

  socket.on('close', () => {
    clearInterval(timer)
    console.warn('[mock-tak] client disconnected')
  })
})
```

**Line by line**

- `import { WebSocketServer } from 'ws'` — the *server* class (listens for clients), vs
  the browser's `WebSocket` *client* class.
- `const PORT = 8087` — named constant, no magic number. (Nod to TAK's real CoT port.)
- `new WebSocketServer({ port: PORT })` — creates the server and starts listening
  immediately. `wss` is the handle.
- `console.warn(...)` — `warn`, not `log` (antfu `no-console`). Backticks → template
  literal for `${PORT}`.
- `makeCot(): string` — builds one CoT message; `: string` is the return type.
- `new Date()` — current time, for the timestamps.
- `new Date(now.getTime() + 60_000)` — `getTime()` is ms since 1970; `+60_000` = 60s,
  so `stale` expires 60s out. `_` is a digit separator, ignored by JS.
- the template string — the CoT XML:
  - `<event uid type time start stale>` — identity, what it is
    (`a-f-G-U-C-I` = friendly ground infantry), and three times.
  - `<point lat lon hae ce le>` — latitude, longitude, height-above-ellipsoid,
    circular & linear error.
  - `<detail><contact callsign>` — extra info; here the radio callsign.
  - `.toISOString()` → `2026-06-05T10:00:00.000Z`, the format CoT expects.
- `wss.on('connection', (socket) => {...})` — runs **per client connect**; `socket` is
  that client's connection. (`wss` = server, `ws` = one socket — convention.)
- `setInterval(() => socket.send(makeCot()), 1000)` — send a fresh CoT every 1000ms;
  `timer` holds the id.
- `socket.on('close', () => clearInterval(timer))` — **cleanup**: stop the timer when
  the client drops. Forgetting it leaks one timer per dead client — same discipline as
  the composable's `onScopeDispose`.

---

### Demo wired to the stream

File: `packages/demo/src/App.vue`. The first real use of `@vue-cot/core` across the
`workspace:*` link.

```vue
<script setup lang="ts">
import { useWebSocket } from '@vue-cot/core'

const { status, data } = useWebSocket('ws://localhost:8087')
</script>

<template>
  <h1>vue-cot demo</h1>
  <p>Status: {{ status }}</p>
  <pre>{{ data }}</pre>
</template>
```

- `import { useWebSocket } from '@vue-cot/core'` — resolves to the local package via the
  workspace symlink; no publish needed.
- `const { status, data } = useWebSocket(...)` — calls the composable, destructures its
  two reactive refs.
- **Template refs auto-unwrap:** `{{ status }}` works directly. Only inside `<script>`
  do you need `status.value`.
- Run server (`@vue-cot/server dev`) and demo (`@vue-cot/demo dev`) in two terminals.
  Status goes `closed → connecting → open`; `data` shows a fresh CoT every second.
  Full pipeline: server → socket → composable → reactive UI.

**Gotcha — `Failed to resolve import "@vue-cot/core"`:** the workspace symlink resolves
the package, but `core/package.json` had no entry field (we deferred `main`/`exports`
to publish time), so the resolver couldn't find which file to load. Fix for dev — point
the package at its TypeScript source:

```json
"exports": {
  ".": "./src/index.ts"
}
```

Standard monorepo dev pattern: internal packages export raw `.ts`, the consuming app's
bundler (Vite) compiles it — no build step in dev. Replaced with built `dist/` + types
at publish time (Phase 8). Restart Vite after changing `package.json`.

---

## Phase 2 — Reconnection logic

### `backoffDelay` — the pure delay function

File: `packages/core/src/utils/backoff.ts`. Pure math: "how long to wait before
attempt N". The give-up / `maxAttempts` policy lives in the composable, not here.

```ts
export type BackoffOptions = {
  baseMs?: number
  maxMs?: number
}

export function backoffDelay(attempt: number, options: BackoffOptions = {}): number {
  const { baseMs = 1000, maxMs = 15_000 } = options
  const exponential = Math.min(baseMs * 2 ** attempt, maxMs)
  const half = exponential / 2
  return half + Math.random() * half
}
```

- **`attempt` is 0-indexed**; `2 ** attempt` → 1, 2, 4, 8… (`**` = power).
- **Cap:** `Math.min(..., maxMs)` — never wait more than 15s. Pre-jitter the delays are
  `1000, 2000, 4000, 8000, 15000` (attempt 4 wants 16000, cap bites).
- **Equal jitter:** `half + random(0, half)` → value in `[half, exponential)`. Attempt 0
  = 500–1000ms.
- **Why equal not full jitter:** full jitter (`random(0, exponential)`) can return
  near-zero → near-instant retry, too aggressive. Equal jitter waits at least half the
  backoff while still spreading clients to break the thundering herd.
- **Decisions:** `baseMs 1000`, `maxMs 15000`, and `maxAttempts: Infinity` (retry
  forever, capped at 15s — right for an always-on tactical feed; server is protected by
  backoff+jitter+cap, and the UI has a status indicator + manual reconnect). `type` over
  `interface` per convention.

### `useReconnectingWebSocket` — auto-reconnect with backoff

File: `packages/core/src/composables/use-reconnecting-websocket.ts`. Wraps the raw
socket idea but with a **re-runnable `connect()`** so it can rebuild the socket on each
retry (the one-shot `useWebSocket` couldn't).

Built in chunks. Line by line below.

**Chunk 1 — status type**

```ts
import type { WebSocketStatus } from './use-websocket'

export type ReconnectingStatus = WebSocketStatus | 'reconnecting'
```

- `import type { WebSocketStatus }` — reuse the existing union from the other file. The
  `type` keyword is required by `verbatimModuleSyntax` (it's a type, erased at build).
- `ReconnectingStatus = WebSocketStatus | 'reconnecting'` — extend it with the one extra
  state this composable can be in.

**Chunk 2 — options type**

```ts
export type ReconnectingOptions = {
  baseMs?: number
  maxMs?: number
  maxAttempts?: number
}
```

- All three are optional (`?`) so `useReconnectingWebSocket(url)` works with no options;
  defaults are filled inside the function.

**Chunk 3 — imports + function shell + state**

```ts
import { onScopeDispose, ref } from 'vue'
import { backoffDelay } from '../utils/backoff'

export function useReconnectingWebSocket(url: string, options: ReconnectingOptions = {}) {
  const { baseMs = 1000, maxMs = 15_000, maxAttempts = Number.POSITIVE_INFINITY } = options

  const status = ref<ReconnectingStatus>('closed')
  const data = ref<string | null>(null)
  const attempts = ref(0)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let manualClose = false
```

- `import { onScopeDispose, ref }` — cleanup hook + reactivity.
- `import { backoffDelay }` — the pure delay function from `utils`.
- `options: ReconnectingOptions = {}` — default `{}` so calling with no options doesn't
  crash the destructure on the next line.
- destructure with defaults: `baseMs 1000`, `maxMs 15_000`, `maxAttempts ∞`
  (`Number.POSITIVE_INFINITY` — antfu prefers it over the global `Infinity`).
- `status` — reactive connection state; starts `'closed'`.
- `data` — latest message string, or `null`.
- `attempts` — reactive retry counter.
- `let ws` — the current socket. `let` (not `const`) because `connect()` reassigns it on
  every retry; `null` until the first connect.
- `let reconnectTimer` — id of the pending retry timer, so we can cancel it.
  `ReturnType<typeof setTimeout>` types it without caring about browser-vs-Node.
- `let manualClose` — `true` when *we* closed on purpose, so `onclose` knows not to
  reconnect.

**Chunk 4 — `connect()`**

```ts
  function connect() {
    ws = new WebSocket(url)
    status.value = 'connecting'

    ws.onopen = () => {
      status.value = 'open'
      attempts.value = 0
    }
    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string')
        data.value = event.data
    }
    ws.onerror = () => {
      console.error('[useReconnectingWebSocket] connection error')
    }
    ws.onclose = () => {
      if (manualClose || attempts.value >= maxAttempts) {
        status.value = 'closed'
        return
      }
      const delay = backoffDelay(attempts.value, { baseMs, maxMs })
      attempts.value++
      status.value = 'reconnecting'
      reconnectTimer = setTimeout(connect, delay)
    }
  }
```

- `ws = new WebSocket(url)` — create (or replace) the socket; it starts handshaking.
- `status = 'connecting'` — mirror readyState 0.
- `onopen` → `'open'`, and **reset `attempts` to 0** — a good connection wipes the
  backoff history so a *future* drop starts counting fresh.
- `onmessage` — `typeof === 'string'` guard (data is `any`: string/Blob/ArrayBuffer);
  keep text only.
- `onerror` → log it (`error` is allowed by antfu; the browser hides the detail anyway).
- `onclose` — the reconnect brain:
  - if `manualClose` (we hung up) **or** `attempts >= maxAttempts` (out of tries) → set
    `'closed'` and stop.
  - else: `delay = backoffDelay(attempts)` (this attempt's wait), `attempts++` (count it),
    `status = 'reconnecting'`, then `setTimeout(connect, delay)` — schedule the next try
    and store its id.

**Chunk 5 — `reconnect()`, `close()`, kickoff, cleanup, return**

```ts
  function reconnect() {
    clearTimeout(reconnectTimer)
    attempts.value = 0
    if (ws) {
      ws.onclose = null
      ws.close()
    }
    manualClose = false
    connect()
  }

  function close() {
    manualClose = true
    clearTimeout(reconnectTimer)
    ws?.close()
  }

  connect()
  onScopeDispose(close)

  return { status, data, attempts, reconnect, close }
}
```

- `reconnect()` — manual "try now, reset backoff":
  - `clearTimeout(reconnectTimer)` — cancel any pending auto-retry.
  - `attempts = 0` — fresh backoff.
  - `if (ws) { ws.onclose = null; ws.close() }` — **detach the close handler before
    closing** the old socket, otherwise its `onclose` would schedule *another* reconnect
    (two sockets racing). Then close it.
  - `manualClose = false` — we *want* the new socket to auto-reconnect on future drops.
  - `connect()` — build the fresh socket immediately.
- `close()` — final teardown:
  - `manualClose = true` — so the resulting `onclose` won't reconnect.
  - `clearTimeout(reconnectTimer)` — kill any pending retry.
  - `ws?.close()` — close if a socket exists (`?.` guards the `null` case).
- `connect()` — eager: open immediately when the composable is called.
- `onScopeDispose(close)` — run `close()` when the owning scope is destroyed. Same
  leak-prevention as `useWebSocket`.
- `return { status, data, attempts, reconnect, close }` — reactive state + the two manual
  controls.

**Chunk 6 — export:** `export * from './composables/use-reconnecting-websocket'` in
`index.ts`.
