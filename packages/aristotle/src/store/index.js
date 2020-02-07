import Vue from 'vue'
import Vuex from 'vuex'
import documents from './modules/documents'

Vue.use(Vuex)

const state = {
  activeDocumentId: '',
  relayedCommand: null,
  toolboxVisible: false,
  toolboxSettings: {},
  contextMenu: {
    position: {
      x: 0,
      y: 0
    },
    show: false
  },
  dialog: {
    open: false,
    type: 'NONE',
    data: {}
  }
}

const getters = {
  activeDocument (state) {
    return state
      .documents
      .filter(({ id }) => state.activeDocumentId === id)
      .pop()
  }
}

const actions = {
  openIntegratedCircuitBuilder ({ commit }, integratedCircuit) {
    commit('SET_DIALOG', {
      open: true,
      type: 'INTEGRATED_CIRCUIT',
      data: integratedCircuit.ports
    })
  }
}

const mutations = {
  SET_DIALOG (state, dialogState) {
    state.dialog = dialogState
  },
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
  SET_CONTEXT_MENU (state, position) {
    if (position) {
      state.contextMenu = { position, show: true }
    } else {
      state.contextMenu = {
        position: {
          x: 0,
          y: 0
        },
        show: false
      }
    }
  },
  UPDATE_ELEMENT_SETTINGS (state, settings) {
    state.elementSettings = settings
  }
}

export default new Vuex.Store({
  state,
  actions,
  getters,
  mutations,
  modules: {
    documents
  }
})
