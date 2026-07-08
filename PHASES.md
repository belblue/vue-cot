# vue-cot — Build Phases

A living tracker for the eight-week build to `v0.1.0`. Each phase teaches one of the
three core skills: **WebSocket lifecycle**, **CoT protocol**, **Pinia at scale**.

**Legend:** `[x]` done · `[~]` in progress · `[ ]` not started

---

## Phase 0 — Scaffolding `[~]`

Monorepo foundation before any feature code.

- [x] pnpm workspace root (`pnpm-workspace.yaml`, private root `package.json`)
- [x] `.gitignore`, shared `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`)
- [x] ESLint with `@antfu/eslint-config` (no Prettier)
- [x] `@vue-cot/core` package (library, Vue as `peerDependency`)
- [x] `@vue-cot/server` package (Node, `@types/node`)
- [x] `@vue-cot/demo` package (Vite + Vue, linked to core via `workspace:*`)
- [x] git repo on `develop`, initial commit
- [ ] fill real copyright holder in `LICENSE`

---

## Phase 1 — WebSocket fundamentals `[x]`

**Builds:** `useWebSocket(url)` · mock TAK server (1 CoT/sec) · demo page that logs messages.

**Teaches:** the browser `WebSocket` API, the four `readyState` values, the `open`/`message`/`error`/`close` events, `onMounted`/`onUnmounted` vs `onScopeDispose`, typed connection status.

- [x] `useWebSocket` — reactive `status` + `data`, four event handlers
- [x] `onScopeDispose` cleanup (closes the socket)
- [x] export from `@vue-cot/core`
- [x] mock server emitting one CoT message per second
- [x] demo wired to `ws://localhost:8087`, status + messages on screen

**Checkpoint:** explain the four readyStates from memory · demonstrate the leak when cleanup is missing · explain why `onScopeDispose` ≠ `onUnmounted` · composable works in a component, a store, and another composable.

---

## Phase 2 — Reconnection logic `[x]`

**Builds:** `useReconnectingWebSocket(url, options)` · `utils/backoff.ts` · state machine with `'reconnecting'`.

**Teaches:** why backoff exists, exponential vs linear vs fixed, jitter and the thundering-herd problem, max-retry limits, manual `reconnect()`, pause/resume on `visibilitychange`.

**Checkpoint:** implement exponential backoff with jitter from a blank file · explain thundering herd in your own words · name three scenarios where backoff matters.

---

## Phase 3 — TAK connection layer `[x]`

**Builds:** `useTakConnection(url, options)` · ping/pong keepalive · newline-delimited message framing · `onConnect`/`onDisconnect`/`onMessage`/`onError` hooks.

**Teaches:** application-level vs TCP keepalive, zombie-connection detection, message framing, `AbortController`. (mTLS deferred to v1.1.)

**Checkpoint:** explain what happens if the server crashes without a close frame · explain WebSocket-level vs application-level ping.

---

## Phase 4 — CoT XML parsing and entity types `[~]`

**Builds:** `parseCoT(xml)` / `serializeCoT(event)` (fast-xml-parser) · full CoT TypeScript types · `cotToGeoJSON` / `geoJSONToCoT` · `useCoTStream(connection)` · parser tests against real samples.

**Teaches:** browser XML parsing without DOMParser, designing types for a real protocol, the `a-f-G-U-C-I` type grammar, the stale-time concept, why the parser stays Vue-free and pure.

**Checkpoint:** hand-write a valid CoT message and decode it field by field · parser survives malformed XML · types compile when consumed externally.

---

## Phase 5 — Reactive entity store `[x]`

**Builds:** `useEntityStore()` — `Map<UID, Entity>` · single-`rAF` TTL sweep · projections (`byAffiliation`, `visibleAt`, `inBounds`, `selected`) · bulk update path.

**Teaches:** `Map` vs object for keyed reactive state, `shallowRef` vs `ref` + `triggerRef`, why not `setTimeout`-per-entity, the single-rAF-tick pattern, notification storms and batching.

**Checkpoint:** 1,000-entity store stays smooth · explain `shallowRef` vs `ref` with three examples · profile and fix a notification storm.

---

## Phase 6 — Pinia integration `[x]`

**Builds:** `stores/connection.ts`, `stores/entities.ts`, `stores/selection.ts` · cross-store composition · demo components consuming via `storeToRefs`.

**Teaches:** Pinia setup syntax, `storeToRefs`, actions/getters/state, `$subscribe`, `$onAction`, store composition, wrapping a composable in a store without losing reactivity.

**Checkpoint:** articulate composable vs Pinia store · three reasons to choose Pinia · one reason to choose plain composables.

---

## Phase 7 — Pinia plugins `[x]`

**Builds:** `pinia-persist.ts` (localStorage) · `pinia-tab-sync.ts` (BroadcastChannel) · both configurable per store.

**Teaches:** the plugin API, plugin context, augmenting stores + TS module augmentation, `$subscribe` inside a plugin, BroadcastChannel, localStorage gotchas (Map/Set serialization, quota).

**Checkpoint:** write a third plugin from scratch · explain why plugins beat repeating the concern in every store.

---

## Phase 8 — Docs, polish, publish, launch `[ ]`

**Builds:** VitePress docs · deployed demo (Cloudflare Pages) · README badges/usage · `@vue-cot/core@0.1.0` on npm · launch posts.

**Teaches:** publish hygiene (`type`/`main`/`module`/`types`/`exports`/`sideEffects`), ESM+CJS dual output with tsup, semantic versioning with changesets, writing developer-facing docs, the Show HN formula.

**Checkpoint:** package installable from npm · demo URL works · three external people have read the README · write a release note unaided.

---

## Stretch (post v0.1)

- [ ] CoT parsing in a Web Worker (v0.2)
- [ ] mTLS client-certificate flow (v0.3)
- [ ] Map-based visual demo
- [ ] CoT Protobuf encoding variant (v0.4)
