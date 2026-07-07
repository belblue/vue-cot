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

---

## Phase 3 — TAK connection layer

**Problem: zombie connections.** A socket can look `open` to the browser while the
server is actually gone (crash / network death, no `close` frame sent). `readyState`
says OPEN but nothing flows. **Fix: application-level keepalive** — periodically ping,
and if no traffic arrives within a timeout, declare it dead and reconnect. Browsers don't
expose WebSocket ping frames to JS (and proxies strip them), so TAK does it at the app
level. Plus **message framing**: TAK delimits CoT events with `\n`, and one socket
message may carry several events or half of one — so we buffer and split on `\n`.

### Prerequisite — expose `send` on `useReconnectingWebSocket`

```ts
function send(payload: string) {
  if (ws && ws.readyState === WebSocket.OPEN)
    ws.send(payload)
}
// added to its return: { status, data, attempts, reconnect, close, send }
```

- `ws && ws.readyState === WebSocket.OPEN` — guard `null` first (between reconnects),
  then check it's open, before sending.

### Mock server — newline-delimit

```ts
const timer = setInterval(() => socket.send(`${makeCot()}\n`), 1000)
```

- Append `\n` so each CoT is a complete frame — matches real TAK and lets the client's
  framing flush.

### `useTakConnection` — the composable

File: `packages/core/src/composables/use-tak-connection.ts`. **Wraps**
`useReconnectingWebSocket` (builds on its returned API — no raw socket re-wiring).

**Chunk 1 — imports + options type**

```ts
import { useReconnectingWebSocket } from './use-reconnecting-websocket'
import { onScopeDispose, watch } from 'vue'

export type TakConnectionOptions = {
  pingIntervalMs?: number
  pingTimeoutMs?: number
  onConnect?: () => void
  onMessage?: (cot: string) => void
  onDisconnect?: () => void
  onError?: () => void
}
```

- value import (we call it) + `watch`/`onScopeDispose` from Vue.
- options = keepalive timings + four lifecycle hooks, all optional. `onMessage` receives
  one framed CoT string.

**Chunk 2 — shell + wrap the lower layer**

```ts
export function useTakConnection(url: string, options: TakConnectionOptions = {}) {
  const connection = useReconnectingWebSocket(url)
  const { status, data, attempts, reconnect, close, send } = connection
  const { pingIntervalMs = 15_000, pingTimeoutMs = 30_000 } = options
  let lastSeen = Date.now()
```

- `options = {}` default so `useTakConnection(url)` works.
- destructure the lower layer's API. **`close` must be here** — omit it and `return
  { close }` silently grabs the global `window.close` (no TS error, wrong behaviour).
- destructure timings with defaults (15s ping, 30s timeout).
- `lastSeen` — timestamp of the last sign of life; `let` (reassigned constantly).

**Chunk 3 — lifecycle hooks via a status watch**

```ts
  watch(status, (newStatus, oldStatus) => {
    if (newStatus === 'open') {
      lastSeen = Date.now()
      options.onConnect?.()
    }
    else if (oldStatus === 'open') {
      options.onDisconnect?.()
    }
  })
```

- `watch(status, (new, old) => ...)` runs on every status change (lazy — only on change).
- became open → reset `lastSeen` (so a stale value can't instantly trigger "dead") and
  fire `onConnect?.()` (optional call — only if provided).
- left open → fire `onDisconnect?.()`.

**Chunk 4 — liveness + framing watches**

```ts
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
      if (trimmed)
        options.onMessage?.(trimmed)
    }
  })
```

- first watch: any message refreshes `lastSeen`.
- framing watch: `buffer` holds partial text across messages. Append `raw`, split on `\n`.
  **`frames.pop() ?? ''`** removes *and* returns the last piece (a possibly-incomplete
  frame) → stash it in `buffer`; the rest are complete → emit each via `onMessage`.
  `for...of` iterates values (not `for...in`, which iterates indices).

**Chunk 5 — keepalive + cleanup + return**

```ts
  const pingTimer = setInterval(() => {
    send('ping')
    if (Date.now() - lastSeen > pingTimeoutMs)
      reconnect()
  }, pingIntervalMs)

  onScopeDispose(() => clearInterval(pingTimer))

  return { status, data, attempts, reconnect, close, send }
}
```

- every `pingIntervalMs` (15s): `send('ping')` (placeholder keepalive; no-ops if not
  open), then if silence exceeds `pingTimeoutMs` (30s) → `reconnect()` (zombie kill).
- `onScopeDispose` clears the timer on teardown.
- `return` re-exposes the API (+ hooks fire as side effects).
- Exported via `export * from './composables/use-tak-connection'`.

---

## Phase 4 — CoT parsing

**The boundary idea:** outside the app, data is messy XML text (possibly malformed);
inside, it's clean typed objects. `parseCoT` (receive) and `serializeCoT` (send) are the
two doors in that wall.

### Types (`protocol/types.ts`)

`CoTEvent` (uid, type, time/start/stale, point, detail?), `CoTPoint` (lat/lon/hae/ce/le —
all `number`), `CoTContact` (callsign?), `CoTDetail` (contact?). The strict target the
parser must produce.

### `parseCoT` — XML string → `CoTEvent`

```ts
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })

export function parseCoT(xml: string): CoTEvent {
  const raw = parser.parse(xml)
  const event = raw?.event
  if (!event)
    throw new Error('invalid CoT: missing <event> root')
  const point = event.point
  if (!point)
    throw new Error('invalid CoT: <event> missing <point>')
  return {
    version: String(event.version),
    uid: String(event.uid),
    // ...String(...) for the identity fields...
    point: { lat: Number(point.lat), /* ...Number(...) for point fields... */ },
    detail: event.detail ? { contact: /* callsign if present */ } : undefined,
  }
}
```

- `ignoreAttributes: false` — CoT's data lives in attributes; keep them.
- `attributeNamePrefix: ''` — access as `point.lat`, not `point['@_lat']`.
- `raw = parser.parse(xml)` → loose nested object; `raw.event` / `event.point` drill in.
- **Guards** throw a clear, catchable error on missing `<event>`/`<point>` (fail loud,
  not cryptic).
- **Coerce at the boundary:** `Number(point.lat)` (attrs arrive as strings) and
  `String(event.uid)`. We *map* the loose object into the strict type, not just cast it.

### `serializeCoT` — `CoTEvent` → XML string

Mirror of parse: templates the fields back into the exact XML shape. Numbers become
strings in the template; `parseCoT` coerces them back, so the round trip holds. (Caveat:
doesn't escape XML-special chars — fine for our controlled data.) Purpose: to **send**
CoT (`connection.send(serializeCoT(event))`), and to enable round-trip testing.

### Tests (`test/parse.test.ts`, `test/serialize.test.ts`)

- Unit: identity, number coercion (`typeof x === 'number'`), nested callsign, and both
  error guards (`expect(() => parseCoT('<foo/>')).toThrow('missing <event>')` — pass a
  **function** so Vitest can catch the throw).
- Round trip: `expect(parseCoT(serializeCoT(event))).toEqual(event)` — `toEqual` is deep
  equality (vs `toBe` = identity).
- Vitest config: `environment: 'happy-dom'`; script `vitest run` (once) vs `vitest`
  (watch).

### `useCoTStream(url, options)` — plug the parser into the live connection

```ts
export function useCoTStream(url: string, options: TakConnectionOptions = {}) {
  const event = ref<CoTEvent | null>(null)
  const error = ref<Error | null>(null)
  const connection = useTakConnection(url, {
    ...options,
    onMessage: (raw) => {
      try {
        event.value = parseCoT(raw)
        error.value = null
        options.onMessage?.(raw)
      }
      catch (err) {
        error.value = err as Error
      }
    },
  })
  return { ...connection, event, error }
}
```

- **Wraps `useTakConnection`, injecting its own `onMessage`.** When the framing loop calls
  `options.onMessage(frame)`, it's calling *this* parser — that's how the stream
  "subscribes": it **is** the message handler.
- **try/catch per message:** a malformed frame sets `error` and leaves `event` on its last
  good value — the connection keeps running, next valid frame updates `event`. One bad
  message can't kill the stream.
- Layer stack: `useWebSocket → reconnecting → takConnection → coTStream`. Each wraps the
  one below and adds one job (socket+retry → framing+keepalive → parsing).
- Demo reads `event` (typed) and shows callsign/type/position instead of raw XML.

---

## Phase 5 — reactive entity store

Holds **every live entity** keyed by `uid` (not just the latest), updating in place and
expiring on `stale`. File: `packages/core/src/composables/use-entity-store.ts`.

### The store + `upsert`

```ts
export type Entity = CoTEvent & { receivedAt: number }

const entities = shallowRef(new Map<string, Entity>())

function upsert(event: CoTEvent) {
  entities.value.set(event.uid, { ...event, receivedAt: Date.now() })
  triggerRef(entities)
}
```

- `Entity = CoTEvent & { receivedAt }` — `&` is intersection (has all of both).
- **`shallowRef`, not `ref`:** with thousands of entities, `ref` deep-wraps the Map and
  every entity field in reactive proxies → a "notification storm" on every update.
  `shallowRef` tracks only the ref itself, not its contents.
- **`triggerRef` is therefore required:** `shallowRef` only auto-reacts when `.value` is
  *replaced* (new reference). `set()` mutates the *same* Map, so nothing fires on its own
  — `triggerRef` manually forces the "trigger" (re-run dependents). Rule: *track on read,
  trigger on write.*
- `upsert` = update-or-insert: `set(uid, ...)` replaces if the uid exists, adds if not.

### TTL sweep (single rAF loop)

```ts
function sweep() {
  const now = Date.now()
  let remove = false
  for (const [uid, entity] of entities.value) {
    if (Date.parse(entity.stale) < now) {
      entities.value.delete(uid)
      remove = true
    }
  }
  if (remove)
    triggerRef(entities)
  rafId = requestAnimationFrame(sweep)   // ALWAYS reschedule — outside the if
}
rafId = requestAnimationFrame(sweep)
onScopeDispose(() => cancelAnimationFrame(rafId))
```

- **`requestAnimationFrame`** runs a fn right before the next repaint (~60/sec), synced to
  rendering, and **auto-pauses when the tab is hidden** (free battery saving). Re-calling
  it inside the fn makes a self-perpetuating loop.
- One loop checks **all** entities per frame — NOT `setTimeout`-per-entity (thousands of
  timers = memory + scheduling overhead + drift).
- `Date.parse(entity.stale) < now` → expired → `delete`. Deleting the current key during
  `for...of` over a Map is safe (adding is not).
- One `triggerRef` per sweep, only if something changed.
- **Bug caught:** if `rafId = requestAnimationFrame(sweep)` is put *inside* `if (remove)`,
  the loop stops after the first frame (nothing stale yet → never reschedules → entities
  never expire). **The loop must reschedule unconditionally; only the notification is
  conditional.**

### Projections (computed over the shallowRef)

```ts
const list = computed(() => Array.from(entities.value.values()))
const count = computed(() => entities.value.size)
const byAffiliation = computed(() => { /* group by entity.type.split('-')[1] */ })
```

- `computed` reads `entities.value` → tracks the shallowRef → recomputes when `triggerRef`
  fires. Also caches (only re-runs when a dep changed).
- Chain: `upsert → triggerRef → list/count/byAffiliation recompute → UI re-renders`. The
  Map is the *same object* throughout; `triggerRef` is what forces the refresh.

### Wiring into the stream + demo

- Added `onEvent?: (event) => void` to `useCoTStream`, fired **per parsed frame** →
  demo passes `onEvent: upsert`. **Lossless** because it's a callback (fires per event);
  *watching the `event` ref would drop messages* — refs coalesce (async watchers see only
  the final value when several arrive in one tick), callbacks don't.
- Demo destructures `const { upsert, list, count } = useEntityStore()`. **Refs nested in a
  plain object don't auto-unwrap in templates** (`store.list` stays a raw ref);
  destructuring to top-level names lets `{{ count }}` / `v-for in list` auto-unwrap.
  (Pinia's `storeToRefs` solves the reverse problem in Phase 6.)
