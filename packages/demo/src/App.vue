<script setup lang="ts">
import { storeToRefs } from 'pinia'

import EntityDetail from './components/EntityDetail.vue'
import EntityList from './components/EntityList.vue'
import { useConnectionStore } from './stores/connection'

const connection = useConnectionStore()
const { status, attempts } = storeToRefs(connection)
</script>

<template>
  <h1>vue-cot demo</h1>
  <p>Status: {{ status }} - attempts {{ attempts }}</p>
  <button @click="connection.reconnect">
    Reconnect
  </button>

  <div style="display: flex; gap: 2rem">
    <EntityList />
    <EntityDetail />
  </div>
</template>
