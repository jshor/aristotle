import Vue from 'vue'

const state = {
  documents: {},
  activeDocumentId: '',
  relayedCommand: null
}

const getters = {
  activeDocument (state) {
    return state.documents[state.activeDocumentId]
  }
}

const mutations = {
  OPEN_DOCUMENT (state, document) {
    Vue.set(state.documents, document.id, document)
    state.activeDocumentId = document.id
  },
  ACTIVATE_DOCUMENT (state, document) {
    state.activeDocumentId = document.id
  },
  SET_EDITOR_MODEL (state, editorModel) {
    state.documents[state.activeDocumentId].editorModel = editorModel
  },
  RELAY_COMMAND (state, relayedCommand) {
    state.relayedCommand = relayedCommand
  }
}

const actions = {}

export default {
  state,
  getters,
  actions,
  mutations
}
