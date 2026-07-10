# vue-cot

A focused Vue 3 library for **Cursor on Target (CoT)** — the XML messaging protocol used
by NATO/US tactical systems such as ATAK, WinTAK and TAK Server.

> **Status:** feature-complete **v0.1**. A well-scoped, self-contained library — not a
> work in progress. Actively maintained.

**Live demo:** [vue-cot-demo.vercel.app](https://vue-cot-demo.vercel.app/) — runs entirely in the browser with a built-in mock CoT feed.

Related packages (`@vue-tactical/map`, `@vue-tactical/symbols`, `@vue-tactical/coords`)
would be interesting to build but are **not currently planned** — open an issue if you'd
like to collaborate. PRs welcome.

## What it does

`vue-cot` connects to a live CoT stream over a WebSocket, parses each tactical message
into typed objects, and keeps a reactive store of entities (units, vehicles, sensors)
that updates and expires itself in real time — ready to render in any Vue 3 app.

```
WebSocket stream  ->  connection layer  ->  parse CoT XML  ->  reactive entity store  ->  your Vue app
   (CoT XML)          reconnect/keepalive    XML -> typed         Map<uid, Entity> + TTL     list / detail
```

## Features

- `useWebSocket` / `useReconnectingWebSocket` — WebSocket lifecycle with exponential
  backoff + jitter.
- `useTakConnection` — application-level keepalive (ping/zombie detection) and
  newline-delimited CoT framing.
- `useCoTStream` — parses framed CoT into typed `CoTEvent` objects.
- `useEntityStore` — reactive `Map<uid, Entity>` with single-`rAF` TTL expiry and derived
  projections.
- `parseCoT` / `serializeCoT` — pure, fully-typed, unit-tested CoT XML parser/serialiser.

## Install

```bash
npm install vue-cot vue
```

`vue` (3.5+) is a peer dependency.

## Usage

```ts
import { useCoTStream, useEntityStore } from 'vue-cot'

const { upsert, list, count } = useEntityStore()
const { status, reconnect } = useCoTStream('wss://your-tak-server:8087', {
  onEvent: upsert,
})
// `list` is a reactive array of live entities; `status` reflects the connection.
```

## Not in scope for v1

mTLS client certificates, a Web Worker parser, the CoT Protobuf variant, TAK Server
federation, mission packages, and map/symbology rendering. These may come in later
releases if there's demand — file an issue.

## Links

- Live demo: https://vue-cot-demo.vercel.app/
- Repository & issues: https://github.com/belblue/vue-cot
- Contributing: issues and PRs welcome; safe fixes and dependency updates get merged,
  larger changes are best discussed in an issue first.

## License

[MIT](./LICENSE)
