import Vue from 'vue'
import Vuex from 'vuex'
import root from './modules/root'

Vue.use(Vuex)

const store = new Vuex.Store(root)

export default store
