import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Document from '../Document.vue'
import { createDocumentStore, DocumentStore, DocumentStoreInstance } from '@/store/document'
import { createItem, createConnection, createPort, stubAll } from '@/store/document/actions/__tests__/__helpers__'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import printing from '@/utils/printing'
import { useRootStore } from '@/store/root'
import { createEditSubmenu } from '@/menus/submenus/edit'
import { ARROW_KEY_MOMENTUM_MULTIPLIER, IMAGE_PADDING, PRINTER_FRIENDLY_COLORS } from '@/constants'
import Connection from '@/types/interfaces/Connection'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'
import Point from '@/types/interfaces/Point'
import { usePreferencesStore } from '@/store/preferences'
import { DocumentStatus } from '@/types/enums/DocumentStatus'
import { ViewType } from '@/types/enums/ViewType'

setActivePinia(createPinia())

describe('Document container', () => {
  let wrapper: VueWrapper
  let storeDefinition: DocumentStore
  let store: DocumentStoreInstance
  let item1: Item, item2: Item
  let port1: Port, port2: Port
  let connection1: Connection

  const documentId = 'test-id'

  beforeEach(() => {
    storeDefinition = createDocumentStore(documentId)
    store = storeDefinition()

    item1 = createItem('item1', ItemType.InputNode, { portIds: ['port1'] })
    item2 = createItem('item2', ItemType.InputNode, { portIds: ['port2'] })
    port1 = createPort('port1', item1.id, PortType.Input)
    port2 = createPort('port1', item2.id, PortType.Output)
    connection1 = createConnection('connection1', 'port1', 'port2')

    store.$reset()
    store.ports = { port1, port2 }
    store.items = { item1, item2 }
    store.connections = { connection1 }
    store.hasLoaded = true

    const rootStore = useRootStore()

    rootStore.dialogType = ViewType.None
    rootStore.activeDocumentId = documentId
    rootStore.documents[documentId] = {
      fileName: 'test-file.alfx',
      displayName: 'Test Document',
      store: storeDefinition
    }

    wrapper = mount(Document, {
      props: {
        store: storeDefinition
      }
    })

    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(cb => {
        cb(1)
        return 0
      })
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('when the store has not yet loaded', () => {
    it('should not render any connections or items', async () => {
      store.hasLoaded = false

      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.item')).toHaveLength(0)
      expect(wrapper.findAll('.connection')).toHaveLength(0)
    })
  })

  describe('when printing an image', () => {
    beforeEach(() => {
      stubAll(printing, ['printImage'])

      store.status = DocumentStatus.Printing
    })

    it('should invoke saveImage() on the root store', () => {
      expect(printing.printImage).toHaveBeenCalledWith(expect.any(HTMLElement), expect.anything(), {
        ...usePreferencesStore().colorStyles,
        ...PRINTER_FRIENDLY_COLORS,
        '--media-display': 'none',
        '--color-selection': 'transparent !important',
        zoom: store.zoom.toString()
      })
    })

    it('should reset the status back to `Ready`', () => {
      expect(store.status).toBe(DocumentStatus.Ready)
    })
  })

  describe('clipboard functions', () => {
    const rootStore = useRootStore()

    beforeEach(() => {
      stubAll(store, [
        'cut',
        'copy',
        'paste'
      ])
      stubAll(rootStore, ['checkPasteability'])
    })

    it('should cut', () => {
      document.dispatchEvent(new Event('cut'))

      expect(store.cut).toHaveBeenCalled()
    })

    it('should copy', () => {
      document.dispatchEvent(new Event('copy'))

      expect(store.copy).toHaveBeenCalled()
    })

    it('should paste', () => {
      document.dispatchEvent(new Event('paste'))

      expect(store.paste).toHaveBeenCalled()
      expect(rootStore.checkPasteability).toHaveBeenCalled()
    })

    it('should not paste when the pasted element is a textbox', () => {
      const input = document.createElement('input')

      input.type = 'text'
      input.focus()

      document.body.appendChild(input)
      input.dispatchEvent(new Event('paste'))

      expect(store.paste).not.toHaveBeenCalled()
    })

    it('should not invoke any clipboard functions when a dialog is open', async () => {
      rootStore.dialogType = ViewType.Preferences

      await wrapper.vm.$nextTick()

      document.dispatchEvent(new Event('cut'))
      document.dispatchEvent(new Event('copy'))
      document.dispatchEvent(new Event('paste'))

      expect(store.cut).not.toHaveBeenCalled()
      expect(store.copy).not.toHaveBeenCalled()
      expect(store.paste).not.toHaveBeenCalled()
    })
  })

  describe('when exporting an image', () => {
    const imageData = 'image-blob-data'
    const rootStore = useRootStore()
    const printArea = document.createElement('div')

    beforeEach(() => {
      stubAll(rootStore, ['saveImage'])

      jest
        .spyOn(printing, 'createPrintArea')
        .mockReturnValue({
          printArea,
          width: 100,
          height: 100
        })
      jest
        .spyOn(printing, 'createImage')
        .mockResolvedValue(imageData)

      store.status = DocumentStatus.SavingImage
    })

    it('should render the print area', () => {
      expect(printing.createPrintArea).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.anything(),
        IMAGE_PADDING,
        {
          '--media-display': 'none',
          '--color-selection': 'transparent !important',
          ...usePreferencesStore().colorStyles,
          zoom: `${1 / store.zoom}`
        }
      )
    })

    it('should render the image', () => {
      expect(printing.createImage).toHaveBeenCalledWith(printArea, 'toBlob')
    })

    it('should invoke saveImage() on the root store', () => {
      expect(rootStore.saveImage).toHaveBeenCalledWith(imageData)
    })

    it('should reset the status back to `Ready`', () => {
      expect(store.status).toBe(DocumentStatus.Ready)
    })

    it('should not attempt to create an image if the canvas is destroyed', async () => {
      store.status = DocumentStatus.Ready

      jest.clearAllMocks()

      await wrapper.unmount()
      store.status = DocumentStatus.SavingImage

      expect(printing.createImage).not.toHaveBeenCalled()
    })
  })

  describe('when pressing the escape key', () => {
    it('should deselect all items', () => {
      stubAll(store, ['deselectAll'])

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(store.deselectAll).toHaveBeenCalled()
    })
  })

  describe('when pressing \'a\'', () => {
    beforeEach(() => stubAll(store, ['selectAll']))

    it('should select all items when the control or command key is held', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }))

      expect(store.selectAll).toHaveBeenCalled()
    })

    it('should not select anything when the control or command key is not held', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: false }))

      expect(store.selectAll).not.toHaveBeenCalled()
    })

    it('should ignore any key events when the target is an input element', async() => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      await wrapper.vm.$nextTick()

      ;(wrapper.vm as any).onKeyDown({ key: 'a', ctrlKey: true, target: input })

      expect(store.selectAll).not.toHaveBeenCalled()
    })
  })

  describe('when pressing the arrow keys', () => {
    beforeEach(() => {
      stubAll(store, [
        'setSelectionPosition',
        'cacheState',
        'commitCachedState'
      ])
    })

    const testArrowKey = (direction: string, point: Point) => {
      it(`should invoke setSelectionPosition() with the given ${direction} when that key is pressed`, () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: `Arrow${direction}` }))

        expect(store.setSelectionPosition).toHaveBeenCalledWith(point)
      })
    }

    testArrowKey('Left', { x: -1, y: 0 })
    testArrowKey('Up', { x: 0, y: -1 })
    testArrowKey('Right', { x: 1, y: 0 })
    testArrowKey('Down', { x: 0, y: 1 })

    it('should not invoke setSelectionPosition() when a non-arrow key is pressed', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }))

      expect(store.setSelectionPosition).not.toHaveBeenCalled()
    })

    describe('when the key is released', () => {
      beforeEach(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

        const momentum = Array(3)
          .fill(0)
          .reduce(total => total * ARROW_KEY_MOMENTUM_MULTIPLIER, 1)

        expect(store.setSelectionPosition).toHaveBeenCalledWith({ x: 0, y: -momentum })

        document.dispatchEvent(new KeyboardEvent('keyup'))
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      })

      it('should reset the momentum when the key is released', () => {
        expect(store.setSelectionPosition).toHaveBeenCalledWith({ x: 0, y: -1 })
      })

      it('should commit the cached state', () => {
        expect(store.cacheState).toHaveBeenCalled()
        expect(store.commitCachedState).toHaveBeenCalled()
      })
    })
  })

  describe('when the context menus are requested', () => {
    xit('should show the editor context menu when the editor requests it', async () => {
      stubAll(window.api, ['showContextMenu'])

      await wrapper
        .findComponent({ name: 'Editor' })
        .vm
        .$emit('contextmenu', new Event('contextmenu'))

      expect(window.api.showContextMenu).toHaveBeenCalledTimes(1)
      expect(window.api.showContextMenu).toHaveBeenCalledWith(createEditSubmenu(storeDefinition))
    })
  })

  describe('when the selector has begun a new selection', () => {
    it('should deselect all items when the `keepSelection` value is `false`', async () => {
      stubAll(store, ['deselectAll'])

      await wrapper
        .findComponent({ name: 'Selector' })
        .vm
        .$emit('selectionStart', false)

      expect(store.deselectAll).toHaveBeenCalled()
    })

    it('should not deselect anything when the `keepSelection` value is `true`', async () => {
      stubAll(store, ['deselectAll'])

      await wrapper
        .findComponent({ name: 'Selector' })
        .vm
        .$emit('selectionStart', true)

      expect(store.deselectAll).not.toHaveBeenCalled()
    })
  })
})
