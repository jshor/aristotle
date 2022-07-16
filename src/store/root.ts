// @ts-check
import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import basic from '../containers/fixtures/basic.json'
import flipFlop from '../containers/fixtures/flipflop.json'
import integratedCircuit from '../containers/fixtures/ic.json'
import testIc from '../containers/fixtures/test.json'

import { createDocumentStore, DocumentStore } from './document'
import { useIntegratedCircuitStore } from './integratedCircuit'
import FileService from '@/services/FileService'
import getFileName from '@/utils/getFileName'
import idMapper from '@/utils/idMapper'

export type RootStore = {
  documents: {
    [id: string]: {
      fileName: string
      filePath?: string
      displayName: string
      store: DocumentStore
    }
  }
  clipboard: string | null
  activeDocumentId: string | null
  canExit: boolean
  isFullscreen: boolean
  isBuilderOpen: boolean
  isToolboxOpen: boolean
}

export const useRootStore = defineStore({
  id: 'root',
  state: (): RootStore => ({
    documents: {},
    clipboard: null,
    activeDocumentId: null,
    canExit: false,
    isFullscreen: false,
    isBuilderOpen: false,
    isToolboxOpen: false
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
    },
    isDialogOpen (state) {
      return state.isBuilderOpen
    }
  },
  actions: {
    async launchIntegratedCircuitBuilder () {
      const integratedCircuitStore = useIntegratedCircuitStore()
      const document = this.activeDocument

      if (document) {
        this.isBuilderOpen = true

        try {
          await integratedCircuitStore.launchBuilder(document.store().$state)

          const store = document.store()

          // const dialogResult = window.api.showMessageBox({
          //   message: `Integrated circuit successfully created. Do you want to add it to the current document?`,
          //   title: 'Confirm',
          //   buttons: ['Yes', 'No']
          // })

          const idMappedIcItem = idMapper.mapIntegratedCircuitIds(integratedCircuitStore.model as Item)



          store.insertItemAtPosition({ item: idMappedIcItem, ports: [] })
          store.setItemBoundingBox(idMappedIcItem.id)
          store.setSelectionState({ id: idMappedIcItem.id, value: true })

        } catch (e) {
          window.api.showMessageBox({ message: 'That\'s okay.' })
        }

        this.isBuilderOpen = false
      }

    },
    openIntegratedCircuit (item: Item) {
      if (item.integratedCircuit) {
        this.openDocument('', item.integratedCircuit.serializedState, item.id, item.name)
      }
    },
    async saveImage (data: Blob) {
      if (!this.activeDocument) return

      try {
        const partialName = this.activeDocument.displayName.replace(/\.[^/.]+$/, "")
        const fileName = `${partialName}.png`
        const filePath = window.api.showSaveFileDialog([
          {
            name: 'PNG Image',
            extensions: ['.png']
          }
        ], fileName)

        if (!filePath) return

        await FileService.writeBlob(filePath, data)
      } catch (error) {
        console.log('ERROR: ', error)
        window.api.showMessageBox({
          message: 'An error occurred while trying to save the image.',
          title: 'Error',
          type: 'error'
        })
      }
    },
    newDocument () {
      const id = uuid()
      const store = createDocumentStore(id)
      const document = store()

      document.resetCircuit()

      this.documents[id] = {
        fileName: 'Untitled Circuit',
        displayName: 'Untitled Circuit',
        store
      }
      this.activateDocument(id)
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
    printActiveDocument () {
      if (this.activeDocument) {
        this.activeDocument.store().isPrinting = true
      }
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

      this.activeDocumentId = null
      store.simulation.stop()
      store.$reset()
      store.$dispose()
      delete this.documents[id]

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

        if (!this.activeDocument.filePath) return true

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
        },
        {
          name: 'Aristotle Integrated Circuit (*.aicx)',
          extensions: ['aicx']
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
        console.log(error)
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
        // if this is an integrated circuit file (.aicx), then it cannot be directly saved
        filePath: /^.*.aicx$/i.test(filePath)
          ? undefined // omit the file path for IC files
          : filePath, // otherwise, use the file path for a typical circuit
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
      this.activeDocument?.store().simulation.stop()
    },
    resumeActivity () {
      this.activeDocument?.store().simulation.start()
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
      useIntegratedCircuitStore().loadLibrary()
    },

    navigateDocumentList (direction: number) {
      const documentIds = Object.keys(this.documents)
      const currentIndex = documentIds.findIndex(id => id === this.activeDocumentId)
      let nextIndex = currentIndex + direction

      if (nextIndex < 0) nextIndex = documentIds.length - 1
      if (nextIndex >= documentIds.length) nextIndex = 0

      this.activateDocument(documentIds[nextIndex])
    },

    toggleFullscreen () {
      this.isFullscreen = !this.isFullscreen

      window.api.setFullscreen(this.isFullscreen)
    },

    toggleToolbox () {
      this.isToolboxOpen = !this.isToolboxOpen
    }
  }
})
