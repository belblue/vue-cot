import { useEntityStore } from 'vue-cot'
import { defineStore } from 'pinia'

export const useEntitiesStore = defineStore('entities', () => {
  return useEntityStore()
})
