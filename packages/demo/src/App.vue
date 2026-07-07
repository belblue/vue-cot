<script setup lang="ts">
import { useCoTStream, useEntityStore } from "@vue-cot/core";

const { upsert, list, count } = useEntityStore();
const { status, attempts, reconnect, event, error } = useCoTStream(
  "ws://localhost:8087",
  {
    onEvent: upsert,
  },
);
</script>

<template>
  <h1>vue-cot demo</h1>
  <p>Status: {{ status }} - attempts {{ attempts }}</p>
  <button @click="reconnect">Reconnect</button>

  <p>Live entities: {{ count }}</p>
  <ul>
    <li v-for="entity in list" :key="entity.uid">
      {{ entity.detail?.contact?.callsign ?? entity.uid }}
      {{ entity.point.lat.toFixed(4) }}, {{ entity.point.lon.toFixed(4) }}
    </li>
  </ul>
</template>
