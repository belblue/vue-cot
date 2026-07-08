import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

import { loggerPlugin } from './plugins/pinia-logger.js'
import { persistPlugin } from './plugins/pinia-persist.js'
import { tabSyncPlugin } from './plugins/pinia-tab-sync.js'

const pinia = createPinia()

pinia.use(persistPlugin)
pinia.use(tabSyncPlugin)
pinia.use(loggerPlugin)

createApp(App).use(pinia).mount('#app')
