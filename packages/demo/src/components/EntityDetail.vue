<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSelectionStore } from '../stores/selection'

const { selected } = storeToRefs(useSelectionStore())
</script>

<template>
  <div v-if="selected">
    <h2>{{ selected.detail?.contact?.callsign ?? selected.uid }}</h2>
    <p>Type: {{ selected.type }}</p>
    <p>
      Position: {{ selected.point.lat.toFixed(5) }},
      {{ selected.point.lon.toFixed(5) }}
    </p>
    <p>Stale: {{ selected.stale }}</p>
  </div>
  <div v-else>
    Select an entity
  </div>
</template>
