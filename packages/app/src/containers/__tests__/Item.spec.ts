import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { StoreDefinition } from 'pinia'
import { createDocumentStore } from '@/store/document'
import DocumentState from '@/store/DocumentState'
import { createItem, createPort } from '@/store/__tests__/__helpers__/helpers'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import Direction from '@/types/enums/Direction'
import Item from '../Item.vue'

describe('Item.vue', () => {
  const itemId = 'item-id'
  const pinia = createTestingPinia()

  afterEach(() => jest.resetAllMocks())

  describe('when the escape key is pressed', () => {
    let wrapper: VueWrapper

    beforeEach(() => {
      const store = createDocumentStore('document')
      const port1 = createPort('port1', itemId, PortType.Input)
      const item = createItem(itemId, ItemType.LogicGate)

      store().addNewItem({ item, ports: [] })
      store().addPort(itemId, port1)

      wrapper = mount(Item, {
        global: {
          plugins: [pinia]
        },
        props: {
          store,
          id: itemId,
          portIds: [port1.id]
        },
        attachTo: document.body
      })
    })

    it('should blur the item', async () => {
      const el = document.querySelector('[data-test="selectable"]') as HTMLDivElement
      const spy = jest.spyOn(el, 'blur')

      el.focus()

      await wrapper.find('[data-test="selectable"]').trigger('keydown.esc')

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should not blur the item if focused on a child element', async () => {
      const el = document.querySelector('[data-test="selectable"]') as HTMLDivElement
      const spy = jest.spyOn(el, 'blur')

      await wrapper.find('[data-test="port-item"]').trigger('focus')
      await wrapper.find('[data-test="selectable"]').trigger('keydown.esc')

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('when the item is being dragged', () => {
    const useStore = createDocumentStore('document')
    const store = useStore()
    const position: Point = {
      x: 10,
      y: 22
    }

    let wrapper: VueWrapper

    beforeEach(() => {
      jest
        .spyOn(store, 'cacheState')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store, 'setSelectionPosition')
        .mockImplementation(jest.fn())

      wrapper = mount(Item, {
        global: {
          plugins: [pinia]
        },
        props: {
          store: useStore,
          id: itemId
        }
      })
    })

    it('should set the item position in the store', async () => {
      wrapper.find('[data-test="selectable"]').trigger('drag', { position })

      expect(store.setSelectionPosition).toHaveBeenCalledTimes(1)
    })

    it('should cache the undo-able state if being dragged for the first time', async () => {
      wrapper.find('[data-test="selectable"]').trigger('drag', { position })

      expect(store.cacheState).toHaveBeenCalledTimes(1)
    })

    it('should not cache the undo-able state if item is already been dragged', async () => {
      wrapper.find('[data-test="selectable"]').trigger('drag', { position })

      jest.resetAllMocks()
      jest
        .spyOn(store, 'cacheState')
        .mockImplementation(jest.fn())

      wrapper.find('[data-test="selectable"]').trigger('drag', { position })

      expect(store.cacheState).not.toHaveBeenCalled()
    })
  })

  describe('when the item has completed dragging', () => {
    const useStore = createDocumentStore('document')
    const store = useStore()
    const position: Point = {
      x: 10,
      y: 22
    }

    let wrapper: VueWrapper

    beforeEach(() => {
      jest
        .spyOn(store, 'commitCachedState')
        .mockImplementation(jest.fn())

      wrapper = mount(Item, {
        global: {
          plugins: [pinia]
        },
        props: {
          store: useStore,
          id: itemId
        }
      })
    })

    it('should commit the cached, undo-able state if actively being dragged', async () => {
      wrapper.find('[data-test="selectable"]').trigger('drag', { position })
      wrapper.find('[data-test="selectable"]').trigger('drag-end')

      expect(store.commitCachedState).toHaveBeenCalledTimes(1)
    })

    it('should not commit the cached, undo-able state if not actively being dragged', async () => {
      wrapper.find('[data-test="selectable"]').trigger('drag-end')

      expect(store.commitCachedState).not.toHaveBeenCalled()
    })
  })

  describe('when the item has ports present', () => {
    let wrapper: VueWrapper
    let store: StoreDefinition<string, DocumentState>

    beforeEach(() => {
      store = createDocumentStore('document')

      const storeInstance = store()
      const port1 = createPort('port1', itemId, PortType.Input, { orientation: Direction.Left })
      const port2 = createPort('port2', itemId, PortType.Output, { orientation: Direction.Right })
      const item = createItem(itemId, ItemType.LogicGate)

      storeInstance.addNewItem({ item, ports: [] })
      storeInstance.addPort(itemId, port1)
      storeInstance.addPort(itemId, port2)

      wrapper = mount(Item, {
        global: {
          plugins: [pinia]
        },
        props: {
          store,
          portIds: [port1.id, port2.id],
          id: itemId
        }
      })
    })

    it('should apply the ports in the correct port-set slots', () => {
      expect(wrapper.findAll('.port-set__container--left [data-test="port-item"]')).toHaveLength(1)
      expect(wrapper.findAll('.port-set__container--right [data-test="port-item"]')).toHaveLength(1)
    })

    describe('when the port is focused', () => {
      let spy: jest.SpyInstance

      beforeEach(() => {
        spy = jest
          .spyOn(store(), 'setActivePortId')
          .mockImplementation(jest.fn())
        jest
          .spyOn(store(), 'selectItem')
          .mockImplementation(jest.fn())

        jest.useFakeTimers()
      })

      afterEach(() => jest.useRealTimers())

      it('should select the connection when not selected', async () => {
        await wrapper.setProps({ isSelected: false })
        await wrapper
          .find('[data-test="port-item"]')
          .trigger('focus')

        jest.advanceTimersByTime(10)

        expect(store().selectItem).toHaveBeenCalledTimes(1)
        expect(store().selectItem).toHaveBeenCalledWith(itemId)
      })

      it('should not select the connection when it is already selected', async () => {
        await wrapper.setProps({ isSelected: true })
        await wrapper
          .find('[data-test="port-item"]')
          .trigger('focus')

        jest.advanceTimersByTime(10)

        expect(store().selectItem).not.toHaveBeenCalled()
      })
    })

    describe('when the port is blurred', () => {
      let spy: jest.SpyInstance

      beforeEach(() => {
        store().activePortId = 'port2'

        spy = jest
          .spyOn(store(), 'setActivePortId')
          .mockImplementation(jest.fn())
      })

      it('should not change the active port ID', async () => {
        await wrapper
          .findAll('[data-test="port-item"]')[0]
          .trigger('blur')

        expect(spy).not.toHaveBeenCalled()
      })

      it('should clear the active port ID if it is equal to the ID of the one blurred', async () => {
        await wrapper
          .findAll('[data-test="port-item"]')[1]
          .trigger('blur')

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(null)
      })
    })
  })

  describe('when the item has modifiable properties', () => {
    let wrapper: VueWrapper
    let store: StoreDefinition<string, DocumentState>

    beforeEach(() => {
      const properties: PropertySet = {
        name: {
          type: 'string',
          value: 'A name',
          label: 'Name'
        }
      }

      store = createDocumentStore('document')

      jest
        .spyOn(store(), 'setProperties')
        .mockImplementation(jest.fn())

      wrapper = mount(Item, {
        global: {
          plugins: [pinia]
        },
        props: {
          store,
          id: itemId,
          properties
        }
      })
    })

    it('should show the properties dialog trigger when the item is selected and focused', async () => {
      await wrapper.find('[data-test="selectable"]').trigger('mousedown')
      await wrapper.setProps({ isSelected: true })

      expect(wrapper.find('[data-test="properties"]').exists()).toBe(true)
    })

    it('should clear the active port ID when the properties dialog trigger is focused', async () => {
      const spy = jest
        .spyOn(store(), 'setActivePortId')
        .mockImplementation(jest.fn())

      await wrapper.find('[data-test="selectable"]').trigger('mousedown')
      await wrapper.setProps({ isSelected: true })
      await wrapper.find('[data-test="properties"]').trigger('focus')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(null)
    })

    it('should not show the properties dialog trigger when the item is not selected', async () => {
      await wrapper.setProps({ isSelected: false })

      expect(wrapper.find('[data-test="properties"]').exists()).toBe(false)
    })
  })

  describe('when the size changes', () => {
    let wrapper: VueWrapper
    let store: StoreDefinition<string, DocumentState>

    beforeEach(() => {
      const properties: PropertySet = {
        name: {
          type: 'string',
          value: 'A name',
          label: 'Name'
        }
      }

      store = createDocumentStore('document')

      wrapper = mount(Item, {
        global: {
          plugins: [pinia]
        },
        props: {
          store,
          id: itemId,
          properties
        }
      })
    })

    it('should update the store with the new size values', async () => {
      const spy = jest
        .spyOn(store(), 'setItemSize')
        .mockImplementation(jest.fn())
      const component = wrapper.vm as any
      const contentRect: DOMRectReadOnly = {
        bottom: 10,
        right: 10,
        left: 2,
        top: 3,
        x: 11,
        y: 22,
        width: 8,
        height: 7,
        toJSON: jest.fn()
      }

      component.onSizeChanged([ { ...wrapper.vm.$el, contentRect } ])

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        id: itemId,
        rect: contentRect
      })
    })
  })

  describe('when the item is an actively-dragged freeport', () => {
    it('should clear the active freeport ID', async () => {
      const useStore = createDocumentStore('document')
      const store = useStore()

      store.activeFreeportId = itemId
      mount(Item, {
        global: {
          plugins: [pinia]
        },
        props: {
          store: useStore,
          id: itemId
        }
      })

      expect(store.activeFreeportId).toBeNull()
    })
  })
})
