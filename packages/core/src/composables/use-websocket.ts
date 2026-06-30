import { onScopeDispose, ref } from "vue";

export type WebSocketStatus = "connecting" | "open" | "closing" | "closed";

export function useWebSocket(url: string) {
  const status = ref<WebSocketStatus>("closed");
  const data = ref<string | null>(null);

  const ws = new WebSocket(url);
  status.value = "connecting";

  ws.onopen = () => {
    status.value = "open";
  };
  ws.onmessage = (event: MessageEvent) => {
    if (typeof event.data === "string") {
      data.value = event.data;
    }
  };
  ws.onclose = () => {
    status.value = "closed";
  };
  ws.onerror = () => {
    console.error("[useWebSocket] connection error");
  };

  function send(payload: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }

  onScopeDispose(() => {
    ws.close();
  });

  return { status, data, send };
}
