import { useCoTStream } from "vue-cot";
import { defineStore } from "pinia";
import { useEntitiesStore } from "./entities";
import { useMockStream } from "../composables/use-mock-stream";

export const useConnectionStore = defineStore("connection", () => {
  const entities = useEntitiesStore();
  const url = import.meta.env.VITE_WS_URL as string | undefined;

  const stream = url
    ? useCoTStream(url, { onEvent: entities.upsert })
    : useMockStream({ onEvent: entities.upsert });
  const { status, attempts, reconnect } = stream;

  return { status, attempts, reconnect };
});
