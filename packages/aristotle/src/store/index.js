import Vue from 'vue'
import Vuex from 'vuex'
import documents from './modules/documents'

Vue.use(Vuex)

const state = {
  activeDocumentId: '',
  relayedCommand: null,
  toolboxVisible: false,
  toolboxSettings: {}
}

const getters = {
  activeDocument (state) {
    return state
      .documents
      .filter(({ id }) => state.activeDocumentId === id)
      .pop()
  }
}

const mutations = {
  OPEN_DOCUMENT (state, document) {
    state.activeDocumentId = document.id
    state.documents.push(document)
  },
  ACTIVATE_DOCUMENT (state, documentId) {
    state.activeDocumentId = documentId
    state.toolboxVisible = false
  },
  SET_EDITOR_MODEL (state, editorModel) {
    state
      .documents
      .filter(({ id }) => state.activeDocumentId === id)
      .forEach((doc) => {
        doc.editorModel = editorModel
      })
  },
  SET_ZOOM_FACTOR (state, zoomFactor) {
    state
      .documents
      .filter(({ id }) => state.activeDocumentId === id)
      .forEach((doc) => {
        Vue.set(doc, 'zoomFactor', zoomFactor)
      })
  },
  RELAY_COMMAND (state, relayedCommand) {
    state.relayedCommand = relayedCommand
  },
  SET_TOOLBOX_VISIBILITY (state, visibility) {
    state.toolboxVisible = visibility
  },
  SET_TOOLBOX_SETTINGS (state, settings) {
    state.toolboxSettings = settings
  },
  UPDATE_ELEMENT_SETTINGS (state, settings) {
    state.elementSettings = settings
  }
}

export default new Vuex.Store({
  state,
  getters,
  mutations,
  modules: {
    documents
  }
})
