import type { WebSocketStatus } from "./use-websocket";
import { ref, onScopeDispose } from "vue";
import { backoffDelay } from "../utils/backoff";

export type ReconnectingStatus = WebSocketStatus | "reconnecting";

export type ReconnectingOptions = {
  baseMs?: number;
  maxMs?: number;
  maxAttempts?: number;
};

export function useReconnectingWebSocket(
  url: string,
  options: ReconnectingOptions = {},
) {
  const {
    baseMs = 1000,
    maxMs = 15_000,
    maxAttempts = Number.POSITIVE_INFINITY,
  } = options;

  const status = ref<ReconnectingStatus>("closed");
  const data = ref<string | null>(null);
  const attempts = ref(0);

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let manualClose = false;

  function connect() {
    ws = new WebSocket(url);
    status.value = "connecting";

    ws.onopen = () => {
      status.value = "open";
      attempts.value = 0;
    };
    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") data.value = event.data;
    };
    ws.onerror = () => {
      console.error("[useReconnectingWebSocket] connection error");
    };
    ws.onclose = () => {
      if (manualClose || attempts.value >= maxAttempts) {
        status.value = "closed";
        return;
      }
    };

    const delay = backoffDelay(attempts.value, { baseMs, maxMs });
    attempts.value++;
    status.value = "reconnecting";
    reconnectTimer = setTimeout(connect, delay);
  }

  function reconnect() {
    clearTimeout(reconnectTimer);
    attempts.value = 0;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    manualClose = false;
    connect();
  }
  function close() {
    manualClose = true;
    clearTimeout(reconnectTimer);
    ws?.close;
  }

  connect();
  onScopeDispose(close);

  return { status, data, attempts, reconnect, close };
}
