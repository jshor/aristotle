import {
  ActionContext,
  ActionTree,
  GetterTree,
  MutationTree
} from 'vuex'
import { ICommand } from '@aristotle/editor'
import IRootState from '../../interfaces/IRootState'


const state: IRootState = {
  activeDocumentId: '',
  relayedCommand: null,
  documents: [],
  dialog: {
    open: false,
    type: 'NONE',
    data: {}
  }
}

const getters: GetterTree<IRootState, IRootState> = {
  activeDocument (state) {
    return state
      .documents
      .filter(({ id }) => state.activeDocumentId === id)
      .pop()
  }
}

const actions: ActionTree<IRootState, IRootState> = {
  /**
   * Sets the Editor command to be relayed to the assigned Editor instance.
   *
   * @param {ActionContext<IRootState, IRootState>} context
   * @param {ICommand} command - command to relay
   * @returns {Promise<void>}
   */
  relayCommand ({ commit }: ActionContext<IRootState, IRootState>, command: ICommand): void {
    commit('RELAY_COMMAND', command)
  },

  openIntegratedCircuitBuilder ({ commit }, integratedCircuit) {
    commit('SET_DIALOG', {
      open: true,
      type: 'INTEGRATED_CIRCUIT',
      data: integratedCircuit
    })
  }
}

const mutations: MutationTree<IRootState> = {
  SET_DIALOG (state, dialogState) {
    state.dialog = dialogState
  },
  OPEN_DOCUMENT (state: IRootState, document) {
    state.activeDocumentId = document.id
    state.documents.push(document)
  },
  ACTIVATE_DOCUMENT (state: IRootState, documentId) {
    state.activeDocumentId = documentId
  },
  SET_EDITOR_MODEL (state: IRootState, editorModel) {
    state
      .documents
      .filter(({ id }) => state.activeDocumentId === id)
      .forEach((doc) => {
        doc.editorModel = editorModel
      })
  },
  RELAY_COMMAND (state: IRootState, relayedCommand: ICommand) {
    state.relayedCommand = relayedCommand
  }
}

export default {
  state,
  getters,
  actions,
  mutations
  // modules: {
  //   documents
  // }
}
