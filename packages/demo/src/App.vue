<script setup lang="ts">
import { useReconnectingWebSocket, useTakConnection } from "@vue-cot/core";
import { ref } from "vue";
import { useCoTStream } from "@vue-cot/core";

const messages = ref<string[]>([]);

const { status, attempts, reconnect, event, error } = useCoTStream(
  "ws://localhost:8087",
);
</script>

<template>
  <h1>vue-cot demo</h1>
  <p>Status: {{ status }} - attempts {{ attempts }}</p>
  <button @click="reconnect">Reconnect</button>

  <div v-if="event">
    <h2>{{ event.detail?.contact?.callsign ?? event.uid }}</h2>
    <p>Type: {{ event.type }}</p>
    <p>Position: {{ event.point.lat }}, {{ event.point.lon }}</p>
    <p>Stale: {{ event.stale }}</p>
  </div>
  <p v-else>Waiting for fisrt message...</p>

  <p v-if="error" style="color: red">Parse error: {{ error }}</p>
</template>
