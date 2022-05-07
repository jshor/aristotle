// @ts-check
import { defineStore, StoreDefinition } from 'pinia'
import { v4 as uuid } from 'uuid'
import DocumentState from './DocumentState'
import basic from '../containers/fixtures/basic.json'
import flipFlop from '../containers/fixtures/flipflop.json'
import integratedCircuit from '../containers/fixtures/ic.json'
import testIc from '../containers/fixtures/test.json'

import { createDocumentStore } from './document'
import FileService from '@/services/FileService'
import getFileName from '@/utils/getFileName'

export type RootStore = {
  documents: {
    [id: string]: {
      fileName: string
      filePath: string
      displayName: string
      store: StoreDefinition<string, DocumentState>
    }
  }
  clipboard: string | null
  activeDocumentId: string | null
  canExit: boolean
}

export const useRootStore = defineStore({
  id: 'root',
  state: (): RootStore => ({
    documents: {},
    clipboard: null,
    activeDocumentId: null,
    canExit: false
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
    openIntegratedCircuit (item: Item) {
      if (item.integratedCircuit) {
        this.openDocument('', item.integratedCircuit.serializedState, item.id, item.name)
      }
    },
    newDocument () {
      console.log('will create new doc')
    },
    async closeAll (): Promise<boolean> {
      if (this.activeDocumentId) {
        const closedSuccessfully = await this.closeDocument(this.activeDocumentId)

        // wait for the next window frame to show the next active document
        await new Promise(resolve => setTimeout(resolve))

        if (closedSuccessfully) {
          return this.closeAll()
        }

        return false // a document refused to close
      }

      return true // all documents successfully closed
    },
    async closeDocument (id: string): Promise<boolean> {
      const document = this.documents[id]
      const store = document.store()
      let isSuccessful = true

      this.activateDocument(id)

      if (store.isDirty) {
        const dialogResult = window.api.showMessageBox({
          message: `Save changes to ${document.fileName}?`,
          title: 'Confirm',
          buttons: ['Yes', 'No', 'Cancel']
        })

        if (dialogResult === 0) {
          // user selected 'Yes' (to save the active document)
          isSuccessful = await this.saveActiveDocument()
        }

        if (dialogResult === 2) {
          // user selected 'Cancel' to continue editing their document
          return false
        }
      }

      // TODO: call some sort of teardown/$dispose() function of document
      delete this.documents[id]
      this.activeDocumentId = null

      const remainingId = Object.keys(this.documents).pop()

      if (remainingId) {
        this.activateDocument(remainingId)
      }

      return isSuccessful
    },
    async saveActiveDocument (setFileName: boolean = false): Promise<boolean> {
      try {
        if (!this.activeDocument) return true
        if (!this.activeDocument.filePath || setFileName) {
          // if no file name is defined yet, ask the user for the location to save it
          const fileName = this.activeDocument.fileName || `${this.activeDocument.fileName}.alfx`
          const filePath = window.api.showSaveFileDialog([
            {
              name: 'Aristotle Logic Circuit (*.alfx)',
              extensions: ['alfx']
            }
          ], fileName)

          if (!filePath) return true
          if (filePath) {
            const fileName = getFileName(filePath)

            this.activeDocument.filePath = filePath
            this.activeDocument.fileName = fileName
            this.activeDocument.displayName = fileName
          }
        }

        const store = this.activeDocument.store()

        FileService.save(this.activeDocument.filePath, {
          items: store.items,
          connections: store.connections,
          groups: store.groups,
          ports: store.ports
        })

        store.isDirty = false

        return true
      } catch (error) {
        window.api.showMessageBox({
          message: 'An error occurred while trying to save the file.',
          title: 'Error',
          type: 'error'
        })

        return false
      }
    },
    async selectDocument () {
      const files = window.api.showOpenFileDialog([
        {
          name: 'Aristotle Logic Circuit (*.alfx)',
          extensions: ['alfx']
        }
      ])

      for (let i = 0; i < files.length; i++) {
        await this.openDocumentFromPath(files[i])
      }
    },
    async openDocumentFromPath (filePath: string) {
      try {
        // TODO: need to create lock on file while open
        const content = await FileService.open(filePath)

        if (content) {
          this.openDocument(filePath, content, uuid())
        }
      } catch (error) {
        console.log('ERR', error)
        window.api.showMessageBox({
          message: `Could not open ${filePath}. The file is not a valid Aristotle circuit.`,
          title: 'Error',
          type: 'error'
        })
      }
    },
    openDocument (filePath: string, content: string, id: string, displayName: string = '') {
      if (this.documents[id]) {
        return this.activateDocument(id)
      }

      const store = createDocumentStore(id)
      const document = store()
      const fileName = getFileName(filePath)

      document.loadDocument(content)

      this.documents[id] = {
        fileName,
        filePath,
        displayName: displayName || fileName,
        store
      }
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
      this.activeDocument?.store().stop()
    },
    resumeActivity () {
      this.activeDocument?.store().start()
    },
    activateDocument (id: string) {
      this.pauseActivity()
      this.activeDocumentId = id
      this.resumeActivity()
    },
    openTestDocuments () {
      // this.openDocument('integrated-circuit.alfx', JSON.stringify({
      //   connections: {},
      //   items: {},
      //   ports: {},
      //   groups: {}
      // }))
      // this.openDocument('test.alfx', JSON.stringify(testIc))
      // this.openDocument('integrated-circuit.alfx', JSON.stringify(integratedCircuit))
      // this.pauseActivity()
      this.openDocument('flip-flop.alfx', JSON.stringify(flipFlop), uuid(), 'flip-flop.alfx')
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
