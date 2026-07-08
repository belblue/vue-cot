import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useEntitiesStore } from './entities'

export const useSelectionStore = defineStore(
  'selection',
  () => {
    const entities = useEntitiesStore()
    const selectedUid = ref<string | null>(null)

    const selected = computed(() =>
      selectedUid.value
        ? (entities.entities.get(selectedUid.value) ?? null)
        : null,
    )

    function select(uid: string | null) {
      selectedUid.value = uid
    }
    return { selectedUid, selected, select }
  },
  { persist: true, syncTabs: true, log: true },
)
