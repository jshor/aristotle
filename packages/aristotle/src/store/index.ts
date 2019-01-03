import Vue from 'vue'
import Vuex from 'vuex'
import documents, { DocumentsState } from './modules/documents'

Vue.use(Vuex)

export type State = {
  documents: DocumentsState
}

export default new Vuex.Store({
  modules: {
    documents
  }
})
