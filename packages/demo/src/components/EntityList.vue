<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useEntitiesStore } from "../stores/entities";
import { useSelectionStore } from "../stores/selection";

const { list, count } = storeToRefs(useEntitiesStore());
const selection = useSelectionStore();
const { selectedUid } = storeToRefs(selection);
</script>
<template>
  <div>
    <h2>Entities {{ count }}</h2>

    <ul>
      <li
        v-for="entity in list"
        :key="entity.uid"
        :class="{ selected: entity.uid === selectedUid }"
        @click="selection.select(entity.uid)"
      >
        {{ entity.detail?.contact?.callsign ?? entity.uid }}
      </li>
    </ul>
  </div>
</template>
<style scoped>
li {
  cursor: pointer;
}
.selected {
  font-weight: bold;
}
</style>
