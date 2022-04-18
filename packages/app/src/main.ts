import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import RemoteService from './services/RemoteService'

RemoteService.assignQuitter()

createApp(App)
  .use(createPinia())
  .mount('#app')
