<script setup lang="ts">
import { useReconnectingWebSocket } from "@vue-cot/core";

const { status, data, attempts, reconnect } = useReconnectingWebSocket(
  "ws://localhost:8087",
);
</script>

<template>
  <h1>vue-cot demo</h1>
  <p>Status: {{ status }} - attempts {{ attempts }}</p>
  <button 2click="reconnect">Reconnect</button>
  <pre>data:{{ data }}</pre>
</template>
