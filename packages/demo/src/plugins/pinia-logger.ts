import type { PiniaPluginContext } from 'pinia'

export function loggerPlugin({ store, options }: PiniaPluginContext) {
  if (!options.log)
    return

  const key = `vue-cot:${store.$id}`

  /* set the variable will store the logs */
  store.$onAction(({ name, args }) => {
    console.warn(`[${store.$id}] action: ${name}`, args)
  })
}

declare module 'pinia' {
  interface DefineStoreOptionsBase<S, Store> {
    log?: boolean
  }
}
