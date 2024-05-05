// @ts-check
import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import basic from '../containers/fixtures/basic.json'
// import flipFlop from '../containers/fixtures/flipflop.json'
import flipFlop from '../containers/fixtures/counter.json'
// import integratedCircuit from '../containers/fixtures/ic.json'
import testIc from '../containers/fixtures/test.json'

import { createDocumentStore, DocumentStore } from './document'
import { useIntegratedCircuitStore } from './integratedCircuit'
import FileService from '@/services/FileService'
import getFileName from '@/utils/getFileName'
import idMapper from '@/utils/idMapper'
import Oscillogram from '@/types/types/Oscillogram'
import Item from '@/types/interfaces/Item'
import { DocumentStatus } from '@/types/enums/DocumentStatus'
import { ViewType } from '@/types/enums/ViewType'

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
  canPaste: boolean
  isDocumentSelectOpen: boolean
  isMobilePulloutOpen: boolean
  isFullscreen: boolean
  dialogType: ViewType
  isToolboxOpen: boolean
  navigationAnimationFrameId: number
  closeDialog?: () => Promise<boolean>
}

export const useRootStore = defineStore({
  id: 'root',
  state: (): RootStore => ({
    documents: {},
    clipboard: null,
    activeDocumentId: null,
    canExit: false,
    canPaste: false,
    isFullscreen: false,
    isToolboxOpen: false,
    isMobilePulloutOpen: false,
    dialogType: ViewType.None,
    isDocumentSelectOpen: false,
    navigationAnimationFrameId: 0
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
    viewType (state) {
      if (state.dialogType) {
        return state.dialogType
      }

      return state.documents[state.activeDocumentId!]
        ? ViewType.Document
        : ViewType.None
    }
  },
  actions: {
    async launchIntegratedCircuitBuilder () {
      const integratedCircuitStore = useIntegratedCircuitStore()
      const document = this.activeDocument

      if (document) {
        await integratedCircuitStore.launchBuilder(document.store().$state)

        const store = document.store()

        // const dialogResult = window.api.showMessageBox({
        //   message: `Integrated circuit successfully created. Do you want to add it to the current document?`,
        //   title: 'Confirm',
        //   buttons: ['Yes', 'No']
        // })

        const idMappedIcItem = idMapper.mapIntegratedCircuitIds(integratedCircuitStore.model as Item)

        store.insertItemAtPosition({ item: idMappedIcItem })
        store.setItemBoundingBox(idMappedIcItem.id)
        store.setItemSelectionState(idMappedIcItem.id, true)
      }
    },
    openIntegratedCircuit (item: Item) {
      if (item.integratedCircuit) {
        this.openDocument('', item.integratedCircuit.serializedState, item.id, item.defaultName)
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

      document.initialize()

      this.documents[id] = {
        fileName: 'Untitled Circuit',
        displayName: 'Untitled Circuit',
        store
      }
      this.activateDocument(id)
    },

    async closeApplication (): Promise<boolean> {
      const dialogCloseResult = await this.closeDialog?.()

      if (dialogCloseResult === false) {
        return false
      }

      return this.closeAllDocuments()
    },

    /**
     * Attempts to close all open documents.
     *
     * @returns true if all documents were closed successfully, false otherwise
     */
    async closeAllDocuments (): Promise<boolean> {
      const openDocuments = [this.activeDocumentId!].concat(Object.keys(this.documents))

      for (let i = 0; i < openDocuments.length; i++) {
        if (this.documents[openDocuments[i]]) {
          const closedSuccessfully = await this.closeDocument(openDocuments[i])

          if (!closedSuccessfully) {
            return false
          }
        }
      }

      return true
    },

    /**
     * Closes the currently-active document.
     */
    async closeActiveDocument () {
      if (!this.activeDocumentId) return

      const closedSuccessfully = await this.closeDocument(this.activeDocumentId)

      if (closedSuccessfully) {
        await this.switchDocument(1)
      }
    },

    /**
     * Closes the document of the given ID.
     * This will prompt the user to save the document if it has unsaved changes.
     *
     * @returns true if the document was closed successfully, false otherwise
     */
    async closeDocument (id: string): Promise<boolean> {
      const document = this.documents[id]
      const store = document.store()

      if (!store.isDirty) {
        if (this.activeDocumentId === id) {
          this.switchDocument(1)
        }
        delete this.documents[id]
        return true
      }

      this.activateDocument(id)

      await store.load()

      const saveDialogResult = window
        .api
        .showMessageBox({
          message: `Save changes to ${document.displayName}?`,
          title: 'Confirm',
          buttons: ['Yes', 'No', 'Cancel']
        })

      if (saveDialogResult === 2) return false
      if (saveDialogResult === 0) {
        try {
          if (!this.attemptDocumentSave()) {
            return false
          }
        } catch (error) {
          const errorDialogResult = window
            .api
            .showMessageBox({
              message: 'An error occurred while trying to save the file. Close anyway?',
              title: 'Error',
              type: 'error',
              buttons: ['Yes', 'No']
            })

          if (errorDialogResult === 1) {
            return false
          }
        }
      }

      store.stopSimulation()
      store.$reset()
      store.$dispose()

      delete this.documents[id]

      return true
    },

    /**
     * Saves the document.
     *
     * @param saveAsNewFile - if true, forces saving the document as a new file
     */
    saveActiveDocument (saveAsNewFile: boolean = false) {
      try {
        this.attemptDocumentSave(saveAsNewFile)
      } catch (error) {
        window
          .api
          .showMessageBox({
            message: 'An error occurred while trying to save the file.',
            title: 'Error',
            type: 'error'
          })
      }
    },

    /**
     * Saves all open documents.
     */
    saveAllDocuments () {
      throw new Error('Not implemented.')
    },

    /**
     * Attempts to save the document as a file.
     * If the document has not been saved before, it will prompt the user to select a location to save the file.
     *
     * @param saveAsNewFile - if true, forces saving the document as a new file
     */
    attemptDocumentSave (saveAsNewFile: boolean = false) {
      if (!this.activeDocument) return true
      if (!this.activeDocument.filePath || saveAsNewFile) {
        // if no file name is defined yet, ask the user for the location to save it
        const fileName = this.activeDocument.fileName || `${this.activeDocument.displayName}.alfx`
        const filePath = window.api.showSaveFileDialog([
          {
            name: 'Aristotle Logic Circuit (*.alfx)',
            extensions: ['alfx']
          }
        ], fileName)

        if (filePath) {
          const fileName = getFileName(filePath)

          this.activeDocument.filePath = filePath
          this.activeDocument.fileName = fileName
          this.activeDocument.displayName = fileName
        }

        return false
      }

      const store = this.activeDocument.store()

      FileService.save(this.activeDocument.filePath!, {
        items: store.items,
        connections: store.connections,
        groups: store.groups,
        ports: store.ports
      })

      store.isDirty = false

      return true
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
      document.oscillator.onTick = (o: Oscillogram) => document.oscillogram = o

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
    pauseActivity () {
      this.activeDocument?.store().stopSimulation()
    },
    resumeActivity () {
      this.activeDocument?.store().startSimulation()
    },
    activateDocument (id: string) {
      this.pauseActivity()
      this.activeDocumentId = id
      this.resumeActivity()
    },
    openTestDocuments () {
      this.openDocument('flip-flop.alfx', JSON.stringify(flipFlop), uuid(), 'flip-flop.alfx')
    },

    switchDocument (direction: number) {
      if (this.navigationAnimationFrameId) return

      this.navigationAnimationFrameId = requestAnimationFrame(async () => {
        const documentIds = Object.keys(this.documents)
        const currentIndex = documentIds.findIndex(id => id === this.activeDocumentId)
        let nextIndex = currentIndex + direction

        if (nextIndex < 0) nextIndex = documentIds.length - 1
        if (nextIndex >= documentIds.length) nextIndex = 0

        this.activateDocument(documentIds[nextIndex])
        await this.activeDocument?.store().load()
        this.navigationAnimationFrameId = 0
      })
    },

    toggleFullscreen () {
      this.isFullscreen = !this.isFullscreen

      window.api.setFullscreen(this.isFullscreen)
    },

    toggleToolbox () {
      this.isToolboxOpen = !this.isToolboxOpen
    },

    checkPasteability () {
      this.canPaste = window.api.canPaste()
    },

    setAllDocumentStatuses (status: DocumentStatus) {
      Object
        .keys(this.documents)
        .forEach(id => this.documents[id].store().setStatus(status))
    }
  }
})
