import Vue from 'vue'

const state = {
  documents: {},
  activeDocumentId: '',
  relayedCommand: null,
  toolboxVisible: false,
  toolboxSettings: {}
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

const actions = {}

export default {
  state,
  getters,
  actions,
  mutations
}
