<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import EntityDetail from './components/EntityDetail.vue'
import EntityList from './components/EntityList.vue'
import { useConnectionStore } from './stores/connection'

const connection = useConnectionStore()
const { status, attempts } = storeToRefs(connection)

const statusTone = computed(() => {
  if (status.value === 'open')
    return 'ok'
  if (status.value === 'closed')
    return 'off'
  return 'wait'
})
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="mark" />
        <div>
          <h1>vue-cot</h1>
          <p class="sub">Cursor on Target — live stream</p>
        </div>
      </div>

      <div class="status">
        <span class="pill" :class="statusTone">
          <span class="dot" />
          {{ status }}
        </span>
        <span v-if="attempts" class="attempts mono">retry #{{ attempts }}</span>
        <button class="btn" @click="connection.reconnect">
          Reconnect
        </button>
      </div>
    </header>

    <main class="grid">
      <EntityList />
      <EntityDetail />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2.5rem;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--panel-border);
  margin-bottom: 1.25rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mark {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}
h1 {
  font-size: 1.15rem;
  font-family: var(--mono);
}
.sub {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.78rem;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--panel);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-dim);
}
.pill.ok {
  color: var(--neutral);
  border-color: color-mix(in srgb, var(--neutral) 40%, transparent);
}
.pill.ok .dot {
  background: var(--neutral);
  box-shadow: 0 0 8px var(--neutral);
}
.pill.wait {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}
.pill.wait .dot {
  background: var(--accent);
  animation: pulse 1s ease-in-out infinite;
}
.pill.off {
  color: var(--hostile);
  border-color: color-mix(in srgb, var(--hostile) 40%, transparent);
}
.pill.off .dot {
  background: var(--hostile);
}
.attempts {
  color: var(--text-dim);
  font-size: 0.75rem;
}

.btn {
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius);
  border: 1px solid var(--panel-border);
  background: var(--panel-2);
  color: var(--text);
  transition: border-color 0.15s, background 0.15s;
}
.btn:hover {
  border-color: var(--accent);
  background: var(--panel);
}

.grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
</style>
