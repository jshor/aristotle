import Vue from 'vue'
import splitPane from 'vue-splitpane'
import App from './App.vue'
import store from './store'
import 'jquery-ui/ui/widgets/draggable'
import 'jquery-ui/ui/widgets/droppable'

Vue.config.productionTip = false

Vue.component('split-pane', splitPane)

new Vue({
  store,
  render: (h) => h(App)
}).$mount('#app')
