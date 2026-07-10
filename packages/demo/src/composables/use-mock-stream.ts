import type { CoTEvent } from "vue-cot";
import { onScopeDispose, ref } from "vue";
import { parseCoT } from "vue-cot";

const CALLSIGNS = ["BLUE-1", "BLUE-2", "BLUE-3", "BLUE-4"];

interface MockOptions {
  onEvent?: (event: CoTEvent) => void;
}

export function useMockStream(options: MockOptions = {}) {
  const status = ref("open");
  const attempts = ref(0);

  function makeCot(uid: string): string {
    const now = new Date();
    const stale = new Date(now.getTime() + 10_000);
    const lat = (40.4168 + (Math.random() - 0.5) * 0.02).toFixed(5);
    const lon = (-3.7038 + (Math.random() - 0.5) * 0.02).toFixed(5);
    return `<event version="2.0" uid="${uid}" type="a-f-G-U-C-I" time="${now.toISOString()}" start="${now.toISOString()}" stale="${stale.toISOString()}"><point lat="${lat}" lon="${lon}" hae="100" ce="5" le="10"/><detail><contact callsign="${uid}"/></detail></event>`;
  }

  const timer = setInterval(() => {
    for (const uid of CALLSIGNS) options.onEvent?.(parseCoT(makeCot(uid)));
  }, 1000);

  onScopeDispose(() => clearInterval(timer));

  function reconnect() {} //mock-mode (no-opt)

  return { status, attempts, reconnect };
}
