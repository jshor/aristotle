import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ComponentPublicInstance } from 'vue'
import Item from '../Item.vue'
import { createDocumentStore, DocumentStore, DocumentStoreInstance } from '@/store/document'
import { createItem, createPort, stubAll } from '@/store/document/actions/__tests__/__helpers__'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import editorContextMenu from '@/menus/context/editor'
import { useRootStore } from '@/store/root'

setActivePinia(createPinia())

describe('Item container', () => {
  let wrapper: VueWrapper<ComponentPublicInstance<typeof Item>>
  let storeDefinition: DocumentStore
  let store: DocumentStoreInstance
  let item1: Item, item2: Item
  let port1: Port, port2: Port

  const props = {
    zIndex: 1,
    isSelected: false,
    id: 'item1',
    flash: false
  }

  beforeEach(() => {
    storeDefinition = createDocumentStore('test-id')
    store = storeDefinition()

    item1 = createItem('item1', ItemType.InputNode, { portIds: ['port1', 'port2'] })
    port1 = createPort('port1', item1.id, PortType.Input)
    port2 = createPort('port2', item1.id, PortType.Output)

    store.ports = { port1, port2 }
    store.items = { item1 }
    store.setItemPosition({ id: item1.id, position: { x: 0, y: 0 } })

    wrapper = mount(Item, {
      props: {
        ...props,
        store: storeDefinition
      }
    })
  })

  afterEach(() => jest.resetAllMocks())

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('when the item rotates', () => {
    it('should match the new rotation', () => {
      store.items.item1.rotation = 2

      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('when the item has variable input ports that have changed', () => {
    it('should match the new rotation', async () => {
      stubAll(store, ['setItemSize'])

      store.items.item1.properties = {
        inputCount: {
          value: 2,
          type: 'number',
          label: 'Input Count'
        }
      }

      await wrapper.vm.$nextTick()

      expect(store.setItemSize).toHaveBeenCalledWith({
        id: 'item1',
        rect: expect.any(Object)
      })
    })
  })

  describe('the properties button', () => {
    it('should be visible on a selected, non-freeport item', async () => {
      store.selectedItemIds = ['item1']

      await wrapper.setProps({ isSelected: true })

      expect(wrapper.findComponent({ name: 'Properties' }).exists()).toBe(true)
    })

    it('should not be visible on a freeport item', async () => {
      store.items.item1.type = ItemType.Freeport
      store.selectedItemIds = ['item1']

      await wrapper.setProps({ isSelected: true })

      expect(wrapper.findComponent({ name: 'Properties' }).exists()).toBe(false)
    })

    it('should not be visible on a non-selected item', async () => {
      await wrapper.setProps({ isSelected: false })

      expect(wrapper.findComponent({ name: 'Properties' }).exists()).toBe(false)
    })

    it('should not be visible when multiple items are selected', async () => {
      store.selectedItemIds = ['item1', 'item2']
      await wrapper.setProps({ isSelected: true })

      expect(wrapper.findComponent({ name: 'Properties' }).exists()).toBe(false)
    })
  })

  describe.skip('when the port is deselected', () => {
    it('should focus the item', async () => {
      const ref = wrapper.vm.$refs.itemRef as any
      const spy = jest.spyOn(ref.$el, 'focus')

      await wrapper
        .findComponent({ name: 'Item' })
        .vm
        .$emit('deselect')

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('when the item is double-clicked', () => {
    it('should reveal the custom circuit, if it exists', () => {
      const rootStore = useRootStore()

      stubAll(rootStore, ['openIntegratedCircuit'])

      item1.subtype = ItemSubtype.CustomCircuit
      wrapper.trigger('dblclick')

      expect(rootStore.openIntegratedCircuit).toHaveBeenCalled()
    })

    it('should not open any integrated circuits if the item is not one', () => {
      const rootStore = useRootStore()

      stubAll(rootStore, ['openIntegratedCircuit'])

      wrapper.trigger('dblclick')

      expect(rootStore.openIntegratedCircuit).not.toHaveBeenCalled()
    })
  })

  describe('when the item has begun to be dragged', () => {
    beforeEach(async () => {
      stubAll(store, [
        'cacheState',
        'setSnapBoundaries'
      ])

      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('dragStart')
    })

    it('should cache the state', () => {
      expect(store.cacheState).toHaveBeenCalledTimes(1)
    })

    it('should compute the new snap boundaries', () => {
      expect(store.setSnapBoundaries).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the item has is being dragged', () => {
    it('should set the new position of the state with respect to the zoom and its offset', async () => {
      const position = {
        x: 10,
        y: 20
      }
      const offset = {
        x: 5,
        y: 10
      }

      stubAll(store, ['dragItem'])

      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('drag', position, offset)

      expect(store.dragItem).toHaveBeenCalledTimes(1)
      expect(store.dragItem).toHaveBeenCalledWith('item1', {
        x: position.x - offset.x - store.items.item1.width / 2 * store.zoomLevel,
        y: position.y - offset.y - store.items.item1.height / 2 * store.zoomLevel
      })
    })
  })

  describe('when a port is blurred', () => {
    it('clear the active port ID', async () => {
      stubAll(store, ['setActivePortId'])

      store.activePortId = 'port1'

      await wrapper
        .find('.port-pivot')
        .trigger('blur')

      expect(store.setActivePortId).toHaveBeenCalledTimes(1)
      expect(store.setActivePortId).toHaveBeenCalledWith(null)
    })

    it('not change the active port ID when it is not active', async () => {
      stubAll(store, ['setActivePortId'])

      store.activePortId = 'port2'

      await wrapper
        .find('.port-pivot')
        .trigger('blur')

      expect(store.setActivePortId).not.toHaveBeenCalled()
    })
  })

  describe('when the item is right-clicked', () => {
    it('should select the item if not already selected', async () => {
      stubAll(store, ['selectItem'])

      await wrapper.trigger('contextmenu')

      expect(store.selectItem).toHaveBeenCalledTimes(1)
      expect(store.selectItem).toHaveBeenCalledWith('item1')
    })

    it('should not select the item if it is already selected', async () => {
      stubAll(store, ['selectItem'])

      await wrapper.setProps({ isSelected: true })
      await wrapper.trigger('contextmenu')

      expect(store.selectItem).not.toHaveBeenCalled()
    })

    it('should show the context menu', async () => {
      stubAll(window.api, ['showContextMenu'])

      await wrapper.trigger('contextmenu')

      expect(window.api.showContextMenu).toHaveBeenCalledTimes(1)
    })
  })
})
