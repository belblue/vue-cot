<script setup lang="ts">
import { useReconnectingWebSocket, useTakConnection } from "@vue-cot/core";
import { ref } from "vue";

const messages = ref<string[]>([]);

const { status, attempts, reconnect } = useTakConnection(
  "ws://localhost:8087",
  {
    onConnect: () => console.warn("[demo] connected"),
    onDisconnect: () => console.warn("[demo] disconnected"),
    onMessage: (cot) => {
      messages.value.unshift(cot);
      if (messages.value.length > 10) messages.value.pop();
    },
  },
);
</script>

<template>
  <h1>vue-cot demo</h1>
  <p>Status: {{ status }} - attempts {{ attempts }}</p>
  <button @click="reconnect">Reconnect</button>
  <p>Messages received: {{ messages.length }}</p>
  <ul>
    <li v-for="(message, i) in messages" :key="i">{{ message }}</li>
  </ul>
  <pre>data:{{ data }}</pre>
</template>
