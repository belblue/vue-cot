import type { PiniaPluginContext } from 'pinia'

export function tabSyncPlugin({ store, options }: PiniaPluginContext) {
  if (!options.syncTabs)
    return

  const channel = new BroadcastChannel(`vue-cot:${store.$id}`)
  let applyingRemote = false

  channel.onmessage = (event) => {
    applyingRemote = true
    store.$patch(event.data)
    applyingRemote = false
  }

  store.$subscribe((_mutation, state) => {
    if (!applyingRemote)
      channel.postMessage(JSON.parse(JSON.stringify(state)))
  })
}

declare module 'pinia' {
  interface DefineStoreOptionsBase<S, Store> {
    syncTabs?: boolean
  }
}
