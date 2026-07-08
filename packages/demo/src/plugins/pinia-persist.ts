import type { PiniaPluginContext } from 'pinia'

export function persistPlugin({ store, options }: PiniaPluginContext) {
  if (!options.persist)
    return

  const key = `vue-cot:${store.$id}`

  const saved = localStorage.getItem(key)
  if (saved)
    store.$patch(JSON.parse(saved))

  store.$subscribe((_mutation, state) => {
    localStorage.setItem(key, JSON.stringify(state))
  })
}

declare module 'pinia' {
  interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean
  }
}
