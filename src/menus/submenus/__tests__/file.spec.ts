import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createFileSubmenu } from '../file'
import { DocumentStore, createDocumentStore } from '@/store/document'
import { t } from '@/utils/i18n'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { useRootStore } from '@/store/root'
import { stubAll } from '@/store/document/actions/__tests__/__helpers__'
import { DocumentStatus } from '@/types/enums/DocumentStatus'
import { ViewType } from '@/types/enums/ViewType'


describe('File submenu', () => {
  const documentId = 'test-document-id'

  beforeEach(() => {
    setActivePinia(createTestingPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should provide an option to create a new document', () => {
    const store = useRootStore()
    const item = buildMenu(createFileSubmenu())[0]

    stubAll(store, ['newDocument'])
    item.click()

    expect(item.label).toBe(t('menu.file.newCircuit'))
    expect(store.newDocument).toHaveBeenCalledTimes(1)
  })

  it('should provide an option to open an existing document', () => {
    const store = useRootStore()
    const item = buildMenu(createFileSubmenu())[2]

    stubAll(store, ['selectDocument'])
    item.click()

    expect(item.label).toBe(t('menu.file.openCircuit'))
    expect(item.accelerator).toBe('CommandOrControl+O')
    expect(store.selectDocument).toHaveBeenCalledTimes(1)
  })

  it('should provide an option to export a new integrated circuit', () => {
    const store = useRootStore()
    const item = buildMenu(createFileSubmenu())[3]

    stubAll(store, ['selectDocument'])
    item.click()

    expect(item.label).toBe(t('menu.file.openIntegratedCircuit'))
    expect(item.accelerator).toBe('CommandOrControl+Shift+O')
    expect(store.selectDocument).toHaveBeenCalledTimes(1)
  })

  describe('saving documents', () => {
    it('should provide an option to save the active document', () => {
      const store = useRootStore()

      store.activeDocumentId = documentId
      const item = buildMenu(createFileSubmenu())[5]

      stubAll(store, ['saveActiveDocument'])
      item.click()

      expect(item.label).toBe(t('menu.file.save'))
      expect(item.accelerator).toBe('CommandOrControl+S')
      expect(item.enabled).toBe(true)
      expect(store.saveActiveDocument).toHaveBeenCalledTimes(1)
    })

    it('should not enable the option to save a file if no documents are open', () => {
      const store = useRootStore()
      store.activeDocumentId = null

      expect(buildMenu(createFileSubmenu())[5].enabled).toBe(false)
    })

    it('should provide an option to save all open documents', () => {
      const store = useRootStore()

      store.activeDocumentId = documentId
      const item = buildMenu(createFileSubmenu())[7]

      stubAll(store, ['saveAllDocuments'])
      item.click()

      expect(item.label).toBe(t('menu.file.saveAll'))
      expect(item.accelerator).toBe('CommandOrControl+Shift+A')
      expect(store.saveAllDocuments).toHaveBeenCalledTimes(1)
    })

    it('should not enable the option to save a file if no documents are open', () => {
      const store = useRootStore()
      store.activeDocumentId = null

      expect(buildMenu(createFileSubmenu())[7].enabled).toBe(false)
    })
  })

  describe('printing a document', () => {
    it('should provide an option to save the active document', () => {
      const store = useRootStore()
      const useDocumentStore = createDocumentStore(documentId)
      const documentStore = useDocumentStore()

      store.activeDocumentId = documentId
      store.documents[documentId] = {
        store: useDocumentStore,
        fileName: 'test-file-name',
        displayName: 'test-document'
      }

      store.activeDocumentId = documentId
      const item = buildMenu(createFileSubmenu())[9]

      stubAll(documentStore, ['setStatus'])
      item.click()

      expect(item.label).toBe(t('menu.file.print'))
      expect(item.accelerator).toBe('CommandOrControl+P')
      expect(item.enabled).toBe(true)
      expect(documentStore.setStatus).toHaveBeenCalledTimes(1)
      expect(documentStore.setStatus).toHaveBeenCalledWith(DocumentStatus.Printing)
    })

    it('should not enable the option to print a document if no documents are open', () => {
      const store = useRootStore()
      store.activeDocumentId = null

      expect(buildMenu(createFileSubmenu())[9].enabled).toBe(false)
    })
  })

  describe('exporting a document', () => {
    it('should provide an option to export the active document', () => {
      const store = useRootStore()
      store.activeDocumentId = documentId

      expect(buildMenu(createFileSubmenu())[11].enabled).toBe(true)
    })

    it('should not enable the option to export a document when one is not active', () => {
      const store = useRootStore()
      store.activeDocumentId = null

      expect(buildMenu(createFileSubmenu())[11].enabled).toBe(false)
    })

    it('should provide an option to export the active document to an integrated circuit', () => {
      const store = useRootStore()
      const useDocumentStore = createDocumentStore(documentId)
      // const documentStore = useDocumentStore()

      store.activeDocumentId = documentId
      store.documents[documentId] = {
        store: useDocumentStore,
        fileName: 'test-file-name',
        displayName: 'test-document'
      }

      store.activeDocumentId = documentId
      const item = buildMenu(createFileSubmenu())[11].submenu[0]

      item.click()

      expect(item.label).toBe(t('menu.file.export.integratedCircuit'))
      expect(item.accelerator).toBe('CommandOrControl+Shift+E')
      // expect(documentStore.setStatus).toHaveBeenCalledTimes(1) // TODO: assert function call
    })


    it('should provide an option to export the active document as a PNG image', () => {
      const store = useRootStore()
      const useDocumentStore = createDocumentStore(documentId)
      const documentStore = useDocumentStore()

      store.activeDocumentId = documentId
      store.documents[documentId] = {
        store: useDocumentStore,
        fileName: 'test-file-name',
        displayName: 'test-document'
      }

      store.activeDocumentId = documentId
      const item = buildMenu(createFileSubmenu())[11].submenu[1]

      stubAll(documentStore, ['setStatus'])
      item.click()

      expect(item.label).toBe(t('menu.file.export.pngImage'))
      expect(item.accelerator).toBe('CommandOrControl+Shift+I')
      expect(documentStore.setStatus).toHaveBeenCalledTimes(1)
      expect(documentStore.setStatus).toHaveBeenCalledWith(DocumentStatus.SavingImage)
    })
  })

  it('should provide an option to open the preferences', () => {
    const store = useRootStore()
    const item = buildMenu(createFileSubmenu())[13]

    item.click()

    expect(item.label).toBe(t('menu.file.preferences'))
    expect(item.accelerator).toBe('CommandOrControl+,')
    expect(store.dialogType).toEqual(ViewType.Preferences)
  })

  describe('when multiple documents are open', () => {
    const numberOfDocuments = 3
    let store: ReturnType<typeof useRootStore>

    beforeEach(() => {
      store = useRootStore()

      stubAll(store, ['switchDocument', 'activateDocument'])

      for (let i = 0; i < numberOfDocuments; i++) {
        store.$patch({
          documents: {
            [`document-${i}`]: {
              store: createDocumentStore(`document-${i}`),
              fileName: `test-file-name-${i}`,
              displayName: `test-document-${i}`
            }
          }
        })
      }
    })

    it('should provide an option to switch to the previous document', () => {
      const item = buildMenu(createFileSubmenu())[15].submenu[0]

      expect(item.label).toBe(t('menu.file.switchTo.previous'))
      expect(item.accelerator).toBe('Ctrl+Shift+Tab')

      item.click()

      expect(store.switchDocument).toHaveBeenCalledTimes(1)
      expect(store.switchDocument).toHaveBeenCalledWith(-1)
    })

    it('should provide an option to switch to the next document', () => {
      const item = buildMenu(createFileSubmenu())[15].submenu[1]

      expect(item.label).toBe(t('menu.file.switchTo.next'))
      expect(item.accelerator).toBe('Ctrl+Tab')

      item.click()

      expect(store.switchDocument).toHaveBeenCalledTimes(1)
      expect(store.switchDocument).toHaveBeenCalledWith(1)
    })

    it('should provide options for each document', () => {
      const items = buildMenu(createFileSubmenu())[15]

      items
        .submenu
        .slice(-numberOfDocuments)
        .forEach((item, i) => {
          store.activeDocumentId = null

          expect(item.type).toBe('checkbox')
          expect(item.label).toBe(`test-document-${i}`)
          expect(item.checked).toBe(false)

          item.click()

          expect(store.activateDocument).toHaveBeenCalledTimes(1)
          expect(store.activateDocument).toHaveBeenCalledWith(`document-${i}`)

          vi.resetAllMocks()
        })
    })

    it('should show a checkmark only next to the open document in the list', () => {
      for (let i = 0; i < numberOfDocuments; i++) {
        store.activeDocumentId = `document-${i}`

        buildMenu(createFileSubmenu())[15]
          .submenu
          .slice(-numberOfDocuments)
          .forEach((item, j) => {
            expect(item.checked).toBe(i === j)
          })
      }
    })
  })

  it('should provide an option to close the document', () => {
    const store = useRootStore()
    const item = buildMenu(createFileSubmenu())[15]

    stubAll(store, ['closeActiveDocument'])
    item.click()

    expect(item.label).toBe(t('menu.file.closeDocument'))
    expect(item.accelerator).toBe('CmdOrCtrl+W')
    expect(store.closeActiveDocument).toHaveBeenCalledTimes(1)
  })

  it('should provide an option to close the application', () => {
    const item = buildMenu(createFileSubmenu())[17]

    stubAll(window, ['close'])
    item.click()

    expect(item.label).toBe(t('menu.file.exit'))
    expect(item.accelerator).toBe('CmdOrCtrl+Q')
    expect(window.close).toHaveBeenCalledTimes(1)
  })
})
