import type { CoTEvent } from "../protocol/types";
import { computed, onScopeDispose, shallowRef, triggerRef } from "vue";

export type Entity = CoTEvent & { receivedAt: number };
export function useEntityStore() {
  const entities = shallowRef(new Map<string, Entity>());

  function upsert(event: CoTEvent) {
    entities.value.set(event.uid, { ...event, receivedAt: Date.now() });
    triggerRef(entities);
  }

  let rafId = 0;
  function sweep() {
    const now = Date.now();
    let remove = false;
    for (const [uid, entity] of entities.value) {
      if (Date.parse(entity.stale) < now) {
        entities.value.delete(uid);
        remove = true;
      }
    }
    if (remove) {
      triggerRef(entities);
    }
    rafId = requestAnimationFrame(sweep);
  }
  rafId = requestAnimationFrame(sweep);
  onScopeDispose(() => cancelAnimationFrame(rafId));

  const list = computed(() => Array.from(entities.value.values()));
  const count = computed(() => entities.value.size);

  const byAffiliation = computed(() => {
    const groups = new Map<string, Entity[]>();
    for (const entity of entities.value.values()) {
      const affiliation = entity.type.split("-")[1] ?? "unknown";
      const group = groups.get(affiliation) ?? [];
      group.push(entity);
      groups.set(affiliation, group);
    }
    return groups;
  });

  return { entities, upsert, list, count, byAffiliation };
}
