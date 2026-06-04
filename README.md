# vue-cot

A Vue 3 library for **Cursor on Target (CoT)** — the XML messaging protocol used by
NATO/US tactical systems such as ATAK, WinTAK and TAK Server.

> Status: early development. Not yet published to npm. APIs will change.

## What it does

`vue-cot` connects to a live CoT stream over a WebSocket, parses each tactical
message into typed objects, and keeps a reactive store of entities (units, vehicles,
sensors) that updates and expires itself in real time — ready to render in any Vue 3 app.

The pipeline:

```
WebSocket stream  ->  connection layer  ->  parse CoT XML  ->  reactive entity store  ->  your Vue app
   (CoT XML)          reconnect/keepalive    XML -> typed         Map<uid, Entity> + TTL     list / detail / map
```

## Packages

This is a pnpm monorepo with three packages:

| Package             | What it is                                                       |
| ------------------- | --------------------------------------------------------------- |
| `@vue-cot/core`     | The library: composables, a pure CoT parser/serialiser, types.  |
| `packages/demo`     | A Vue 3 demo app that consumes the library (UI lives only here). |
| `packages/server`   | A small Node WebSocket server that emits fake CoT for dev/tests. |

## Requirements

- Node.js 20 LTS or newer
- pnpm 9 or newer

## Quick start (development)

```bash
pnpm install        # install all workspace dependencies
```

More scripts (mock server, demo app, tests) will be documented here as each package
is built out.

## Roadmap

Built over eight phases, each focused on one skill:

1. WebSocket fundamentals — `useWebSocket`
2. Reconnection with exponential backoff + jitter
3. TAK connection layer — keepalive, message framing
4. CoT XML parsing and typed entities
5. Reactive entity store with TTL expiry
6. Pinia integration in the demo app
7. Custom Pinia plugins (persistence, cross-tab sync)
8. Docs, demo polish, npm publish

## License

[MIT](./LICENSE)
