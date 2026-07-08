import { useCoTStream } from '@vue-cot/core'
import { defineStore } from 'pinia'
import { useEntitiesStore } from './entities'

export const useConnectionStore = defineStore('connection', () => {
  const entities = useEntitiesStore()

  const { status, attempts, reconnect } = useCoTStream('ws://localhost:8087', {
    onEvent: entities.upsert,
  })

  return { status, attempts, reconnect }
})
