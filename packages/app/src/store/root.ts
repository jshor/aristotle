// @ts-check
import { defineStore, acceptHMRUpdate, Store, StoreDefinition } from 'pinia'
import DocumentState from './DocumentState'
import RemoteService from '@/services/RemoteService'
import basic from '../containers/fixtures/basic.json'
import flipFlop from '../containers/fixtures/flipflop.json'
import integratedCircuit from '../containers/fixtures/ic.json'

import { createDocumentStore } from './document'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

export type RootStore = {
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
    async closeApplication () {
      const documentIds = Object.keys(this.documents)

      for (let i = documentIds.length - 1; i >= 0; i--) {
        const id = documentIds[i]

        await this.closeDocument(id)

        if (this.documents[id]) {
          break // the document refused to close, so break out of the loop
        }
      }

      if (!this.hasOpenDocuments) {
        // if there are no more documents open, then go on to close the app
        RemoteService.quit()
      }
    },
    async closeDocument (id: string): Promise<void> {
      const document = this.documents[id]

      if (!document) return Promise.resolve()

      const store = document.store()

      this.activateDocument(id)

      if (store.canUndo || store.canRedo || true) { // TODO: remove 'true' after done testing
        const result = RemoteService.showMessageBox({
          message: `Save changes to ${document.fileName}?`,
          title: 'Confirm',
          buttons: ['Yes', 'No', 'Cancel']
        })
        const close = async () => {
          delete this.documents[id]

          const remainingId = Object.keys(this.documents).pop()

          if (remainingId) {
            this.activateDocument(remainingId)
          }

          // wait for the next window frame to show the next active document
          await new Promise(resolve => setTimeout(resolve))
        }

        switch (result) {
          case 0:
            console.log('NEED TO SAVE DOCUMENT')
            await close()
            break
          case 1:
            await close()
            break
          default:
            console.log('DID NOT WANT TO CLOSE')
            break
        }
      }
    },
    selectDocument () {
      console.log('will open file dialog')
    },
    openDocument (fileName: string, content: string) {
      const id = rand()
      const store = createDocumentStore(id)

      const document = store()

      document.buildCircuit()
      document.loadDocument(content)

      this.documents[id] = { fileName, store }

      this.activateDocument(id)
    },
    switchDocument (direction: number) {
      const documentIds = Object.keys(this.documents)
      const currentIndex = documentIds.findIndex(id => this.activeDocumentId === id)

      let nextIndex = currentIndex + direction

      if (documentIds.length === 0) return
      if (currentIndex === -1 || nextIndex >= documentIds.length) nextIndex = 0
      else if (nextIndex < 0) nextIndex = documentIds.length - 1

      this.activateDocument(documentIds[nextIndex])
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
    }
  }
})
