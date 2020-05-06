import Vue from 'vue'
import splitPane from 'vue-splitpane'
import App from './App.vue'
import store from './store'
import { EventBus } from './utils/bus'

Vue.config.productionTip = false

Vue.component('split-pane', splitPane)

if (module.hot) {
  console.log('is hot 1')
  module.hot.accept('../../editor', function() {
    console.log('reload editor from main.ts')
    EventBus.$emit('hot-reload')
  })
}
new Vue({
  store,
  render: (h) => h(App)
}).$mount('#app')
