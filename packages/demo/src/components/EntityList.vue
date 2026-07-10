<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEntitiesStore } from '../stores/entities'
import { useSelectionStore } from '../stores/selection'

const { list, count } = storeToRefs(useEntitiesStore())
const selection = useSelectionStore()
const { selectedUid } = storeToRefs(selection)

// CoT type e.g. "a-f-G-U-C-I" — index 1 is the affiliation letter.
function affiliation(type: string): string {
  const letter = type.split('-')[1]
  return letter === 'f'
    ? 'friendly'
    : letter === 'h'
      ? 'hostile'
      : letter === 'n'
        ? 'neutral'
        : 'unknown'
}
</script>

<template>
  <section class="panel list">
    <header class="head">
      <h2>Entities</h2>
      <span class="badge mono">{{ count }}</span>
    </header>

    <ul v-if="list.length">
      <li
        v-for="entity in list"
        :key="entity.uid"
        :class="{ selected: entity.uid === selectedUid }"
        @click="selection.select(entity.uid)"
      >
        <span class="aff" :class="affiliation(entity.type)" />
        <span class="name">{{ entity.detail?.contact?.callsign ?? entity.uid }}</span>
        <span class="type mono">{{ entity.type }}</span>
      </li>
    </ul>

    <p v-else class="empty">
      Waiting for entities…
    </p>
  </section>
</template>

<style scoped>
.list {
  overflow: hidden;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--panel-border);
}
h2 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
}
.badge {
  min-width: 1.5rem;
  text-align: center;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: var(--panel-2);
  border: 1px solid var(--panel-border);
  font-size: 0.75rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0.35rem;
  max-height: 60vh;
  overflow-y: auto;
}
li {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.55rem;
  align-items: center;
  padding: 0.45rem 0.55rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}
li:hover {
  background: var(--panel-2);
}
li.selected {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  box-shadow: inset 2px 0 0 var(--accent);
}

.aff {
  grid-row: 1 / span 2;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.aff.friendly {
  background: var(--friendly);
}
.aff.hostile {
  background: var(--hostile);
}
.aff.neutral {
  background: var(--neutral);
}
.aff.unknown {
  background: var(--unknown);
}

.name {
  font-weight: 500;
}
.type {
  grid-column: 2;
  color: var(--text-dim);
  font-size: 0.72rem;
}

.empty {
  padding: 1.25rem 0.9rem;
  color: var(--text-dim);
  font-size: 0.85rem;
}
</style>
