<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSelectionStore } from '../stores/selection'

const { selected } = storeToRefs(useSelectionStore())
</script>

<template>
  <section class="panel detail">
    <template v-if="selected">
      <header class="head">
        <h2>{{ selected.detail?.contact?.callsign ?? selected.uid }}</h2>
        <span class="uid mono">{{ selected.uid }}</span>
      </header>

      <dl>
        <div class="row">
          <dt>Type</dt>
          <dd class="mono">{{ selected.type }}</dd>
        </div>
        <div class="row">
          <dt>Position</dt>
          <dd class="mono">
            {{ selected.point.lat.toFixed(5) }}, {{ selected.point.lon.toFixed(5) }}
          </dd>
        </div>
        <div class="row">
          <dt>Altitude</dt>
          <dd class="mono">{{ selected.point.hae }} m</dd>
        </div>
        <div class="row">
          <dt>Stale</dt>
          <dd class="mono">{{ selected.stale }}</dd>
        </div>
      </dl>
    </template>

    <div v-else class="empty">
      <span class="crosshair">⌖</span>
      <p>Select an entity to inspect</p>
    </div>
  </section>
</template>

<style scoped>
.detail {
  min-height: 220px;
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--panel-border);
}
h2 {
  font-size: 1.05rem;
}
.uid {
  color: var(--text-dim);
  font-size: 0.75rem;
}

dl {
  margin: 0;
  padding: 0.5rem 1rem 1rem;
}
.row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 55%, transparent);
}
.row:last-child {
  border-bottom: none;
}
dt {
  color: var(--text-dim);
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}
dd {
  margin: 0;
  color: var(--text);
  font-size: 0.85rem;
  word-break: break-word;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 220px;
  color: var(--text-dim);
}
.crosshair {
  font-size: 2rem;
  color: var(--panel-border);
}
.empty p {
  margin: 0;
  font-size: 0.85rem;
}
</style>
