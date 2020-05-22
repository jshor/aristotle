import Vue from 'vue';
import Vuex from 'vuex';
import documents from './modules/todo/store'

Vue.use(Vuex);

export default (initialState?: any) => {
  return new Vuex.Store({
    modules: {
      documents
    },
  });
};
