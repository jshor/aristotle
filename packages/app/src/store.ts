import Vue from 'vue';
import Vuex from 'vuex';
import documents from './modules/documents/store'

Vue.use(Vuex);

export default (initialState?: any) => {
  return new Vuex.Store({
    modules: {
      documents
    },
  });
};
