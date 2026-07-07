import type { CoTEvent } from "../protocol/types";
import type { TakConnectionOptions } from "./use-tak-connection";
import { ref } from "vue";
import { parseCoT } from "../protocol/parse";
import { useTakConnection } from "./use-tak-connection";
import { parse } from "vue/compiler-sfc";

export type CoTStreamOptions = TakConnectionOptions & {
  onEvent?: (event: CoTEvent) => void;
};

export function useCoTStream(url: string, options: CoTStreamOptions = {}) {
  const event = ref<CoTEvent | null>(null);
  const error = ref<Error | null>(null);

  const connection = useTakConnection(url, {
    ...options,
    onMessage: (raw) => {
      try {
        const parsed = parseCoT(raw);
        event.value = parseCoT(raw);
        error.value = null;
        options.onEvent?.(parsed);
        options.onMessage?.(raw);
      } catch (err) {
        error.value = err as Error;
      }
    },
  });

  return { ...connection, event, error };
}
