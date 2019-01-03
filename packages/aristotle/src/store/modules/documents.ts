import Vue from 'vue'
import DocumentModel from '@/models/DocumentModel'
import EditorModel from '@/models/EditorModel'
import CommandModel from '@/models/CommandModel'

export type DocumentsState = {
  documents: {
    [key: string]: DocumentModel
  },
  activeDocumentId: string,
  relayedCommand?: CommandModel
}

const state: DocumentsState = {
  documents: {},
  activeDocumentId: '',
  relayedCommand: new CommandModel()
}

const getters = {
  activeDocument (state: DocumentsState) {
    return state.documents[state.activeDocumentId]
  }
}

const mutations = {
  OPEN_DOCUMENT (state: DocumentsState, document: DocumentModel) {
    Vue.set(state.documents, document.id, document)
    state.activeDocumentId = document.id
  },
  ACTIVATE_DOCUMENT (state: DocumentsState, document: DocumentModel) {
    state.activeDocumentId = document.id
  },
  SET_EDITOR_MODEL (state: DocumentsState, editorModel: EditorModel) {
    state.documents[state.activeDocumentId].editorModel = editorModel
  },
  RELAY_COMMAND (state: DocumentsState, relayedCommand: CommandModel) {
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
