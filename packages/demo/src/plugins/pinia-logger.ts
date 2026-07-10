import type { PiniaPluginContext } from 'pinia'

export function loggerPlugin({ store, options }: PiniaPluginContext) {
  if (!options.log)
    return

  /* set the variable will store the logs */
  store.$onAction(({ name, args }) => {
    console.warn(`[${store.$id}] action: ${name}`, args)
  })
}

declare module 'pinia' {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface DefineStoreOptionsBase<S, Store> {
    log?: boolean
  }
}
