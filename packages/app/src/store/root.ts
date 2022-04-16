// @ts-check
import { defineStore, acceptHMRUpdate, Store, StoreDefinition } from 'pinia'
import DocumentState from './DocumentState'

import basic from '../containers/fixtures/basic.json'
import flipFlop from '../containers/fixtures/flipflop.json'
import integratedCircuit from '../containers/fixtures/ic.json'

import { createDocumentStore } from './document'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

type RootStore = {
  documents: {
    [id: string]: {
      fileName: string
      store: StoreDefinition<string, DocumentState>
    }
  },
  activeDocumentId: string | null
}

export const useRootStore = defineStore({
  id: 'root',
  state: (): RootStore => ({
    documents: {},
    activeDocumentId: null
  }),
  getters: {
    hasOpenDocuments (state) {
      return Object
        .keys(state.documents)
        .length > 0
    },
    activeDocument (state) {
      if (state.activeDocumentId) {
        return state.documents[state.activeDocumentId]
      }

      return null
    }
  },
  actions: {
    openDocument (fileName: string, content: string) {
      const id = rand()
      const store = createDocumentStore(id)

      const document = store()

      document.buildCircuit()
      document.loadDocument(content)

      this.documents[id] = { fileName, store }
      this.activeDocumentId = id
    },
    pauseActivity () {
      if (this.activeDocument) {
        this
          .activeDocument
          .store()
          .stop()
      }
    },
    resumeActivity () {
      if (this.activeDocument) {
        this
          .activeDocument
          .store()
          .start()
      }
    },
    activateDocument (id: string) {
      this.pauseActivity()
      this.activeDocumentId = id
      this.resumeActivity()
    },
    openTestDocuments () {
      // this.openDocument('basic.alfx', JSON.stringify(basic))
      this.openDocument('integrated-circuit.alfx', JSON.stringify(integratedCircuit))
      this.pauseActivity()
      this.openDocument('flip-flop.alfx', JSON.stringify(flipFlop))
    },

    navigateDocumentList (direction: number) {
      const documentIds = Object.keys(this.documents)
      const currentIndex = documentIds.findIndex(id => id === this.activeDocumentId)
      let nextIndex = currentIndex + direction

      if (nextIndex < 0) nextIndex = documentIds.length - 1
      if (nextIndex >= documentIds.length) nextIndex = 0

      this.activateDocument(documentIds[nextIndex])
    },

    closeDocument (documentId: string) {
      delete this.documents[documentId]
      this.navigateDocumentList(-1)
    }
  }
})
