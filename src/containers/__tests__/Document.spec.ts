import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ComponentPublicInstance } from 'vue'
import Document from '../Document.vue'
import { createDocumentStore, DocumentStore, DocumentStoreInstance } from '@/store/document'
import { createItem, createConnection, createPort, stubAll } from '@/store/document/actions/__tests__/__helpers__'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import printing from '@/utils/printing'
import { useRootStore } from '@/store/root'
import editorContextMenu from '@/menus/context/editor'
import { ARROW_KEY_MOMENTUM_MULTIPLIER, IMAGE_PADDING } from '@/constants'
import Connection from '@/types/interfaces/Connection'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'
import Point from '@/types/interfaces/Point'

setActivePinia(createPinia())

describe('Document container', () => {
  let wrapper: VueWrapper
  let storeDefinition: DocumentStore
  let store: DocumentStoreInstance
  let item1: Item, item2: Item
  let port1: Port, port2: Port
  let connection1: Connection

  beforeEach(() => {
    storeDefinition = createDocumentStore('test-id')
    store = storeDefinition()

    item1 = createItem('item1', ItemType.InputNode, { portIds: ['port1'] })
    item2 = createItem('item2', ItemType.Freeport, { portIds: ['port2'] })
    port1 = createPort('port1', item1.id, PortType.Input)
    port2 = createPort('port1', item2.id, PortType.Output)
    connection1 = createConnection('connection1', 'port1', 'port2')

    store.ports = { port1, port2 }
    store.items = { item1, item2 }
    store.connections = { connection1 }
    store.hasLoaded = true

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

  afterEach(() => jest.resetAllMocks())

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

      store.isPrinting = true
    })

    it('should invoke saveImage() on the root store', () => {
      expect(printing.printImage).toHaveBeenCalledWith(store.zoom, expect.any(HTMLElement), expect.anything())
    })

    it('should reset `isCreatingImage` back to `false`', () => {
      expect(store.isPrinting).toBe(false)
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

      store.isCreatingImage = true
    })

    it('should render the print area', () => {
      expect(printing.createPrintArea).toHaveBeenCalledWith(
        1 / store.zoom,
        expect.any(HTMLElement),
        expect.anything(),
        IMAGE_PADDING,
        ''
      )
    })

    it('should render the image', () => {
      expect(printing.createImage).toHaveBeenCalledWith(printArea, 'toBlob')
    })

    it('should invoke saveImage() on the root store', () => {
      expect(rootStore.saveImage).toHaveBeenCalledWith(imageData)
    })

    it('should reset `isCreatingImage` back to `false`', () => {
      expect(store.isCreatingImage).toBe(false)
    })

    it('should not attempt to create an image if the canvas is destroyed', async () => {
      store.isCreatingImage = false

      jest.clearAllMocks()

      await wrapper.unmount()
      store.isCreatingImage = true

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
    beforeEach(() => stubAll(store, ['moveSelectionPosition']))
    const testArrowKey = (direction: string, point: Point) => {
      it(`should invoke moveSelectionPosition() with the given ${direction} when that key is pressed`, () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: `Arrow${direction}` }))

        expect(store.moveSelectionPosition).toHaveBeenCalledWith(point)
      })
    }

    testArrowKey('Left', { x: -1, y: 0 })
    testArrowKey('Up', { x: 0, y: -1 })
    testArrowKey('Right', { x: 1, y: 0 })
    testArrowKey('Down', { x: 0, y: 1 })

    it('should not invoke moveSelectionPosition() when a non-arrow key is pressed', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }))

      expect(store.moveSelectionPosition).not.toHaveBeenCalled()
    })

    it('should reset the momentum when the key is released', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

      const momentum = Array(3)
        .fill(0)
        .reduce((total, i) => total * ARROW_KEY_MOMENTUM_MULTIPLIER, 1)

      expect(store.moveSelectionPosition).toHaveBeenCalledWith({ x: 0, y: -momentum })

      document.dispatchEvent(new KeyboardEvent('keyup'))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

      expect(store.moveSelectionPosition).toHaveBeenCalledWith({ x: 0, y: -1 })
    })
  })

  describe('when the context menus are requested', () => {
    it('should show the editor context menu when an item requests it', async () => {
      stubAll(window.api, ['showContextMenu'])

      await wrapper
        .findComponent({ name: 'Item' })
        .vm
        .$emit('contextmenu', new Event('contextmenu'))

      expect(window.api.showContextMenu).toHaveBeenCalledTimes(1)
      expect(window.api.showContextMenu).toHaveBeenCalledWith(editorContextMenu(storeDefinition))
    })
  })

  describe('when the selector has begun a new selection', () => {
    it('should deselect all items when the shift key is not held', async () => {
      stubAll(store, ['deselectAll'])

      await wrapper
        .findComponent({ name: 'Selector' })
        .vm
        .$emit('selectionStart', {
          ctrlKey: false
        })

      expect(store.deselectAll).toHaveBeenCalled()
    })

    it('should not deselect anything when the shift key is held', async () => {
      stubAll(store, ['deselectAll'])

      await wrapper
        .findComponent({ name: 'Selector' })
        .vm
        .$emit('selectionStart', {
          ctrlKey: true
        })

      expect(store.deselectAll).not.toHaveBeenCalled()
    })
  })
})
