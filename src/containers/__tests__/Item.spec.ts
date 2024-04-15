import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Item from '../Item.vue'
import { createDocumentStore, DocumentStore, DocumentStoreInstance } from '@/store/document'
import { createItem, createPort, stubAll } from '@/store/document/actions/__tests__/__helpers__'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import { useRootStore } from '@/store/root'
import type ItemInterface from '@/types/interfaces/Item'
import Port from '@/types/interfaces/Port'
import LogicValue from '@/types/enums/LogicValue'
import ClockPulse from '@/store/document/oscillator/ClockPulse'

setActivePinia(createPinia())

describe('Item container', () => {
  let wrapper: VueWrapper
  let storeDefinition: DocumentStore
  let store: DocumentStoreInstance
  let item1: ItemInterface
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
    port1 = createPort('port1', item1.id, PortType.Input, { isMonitored: true, hue: 12 })
    port2 = createPort('port2', item1.id, PortType.Output)

    store.ports = { port1, port2 }
    store.items = { item1 }
    store.setItemPosition({ id: item1.id, position: { x: 0, y: 0 } })

    wrapper = mount(Item, {
      props: {
        ...props,
        store: storeDefinition
      },
      global: {
        stubs: {
          Properties: true
        }
      }
    })
  })

  afterEach(() => vi.resetAllMocks())

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('when the item rotates', () => {
    it('should match the new rotation', () => {
      store.items.item1.rotation = 2

      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('when property values change', () => {
    describe('when the item name has changed', () => {
      beforeEach(async () => {
        stubAll(store, [
          'setItemName'
        ])

        await wrapper.vm.$nextTick()
        vi.resetAllMocks()
      })

      it('should not change the state if the name is not configurable', async () => {
        store.items.item1.properties.startValue = {
          value: LogicValue.FALSE,
          type: 'text',
          label: 'Start value'
        }

        await wrapper.vm.$nextTick()

        expect(store.setItemName).not.toHaveBeenCalled()
      })

      it('should not change the name if it is the same as the current item name', async () => {
        store.items.item1.name = 'Old Name'
        store.items.item1.properties.name = {
          value: 'Old Name',
          type: 'text',
          label: 'Name'
        }

        await wrapper.vm.$nextTick()

        expect(store.setItemName).not.toHaveBeenCalled()
      })

      it('should update the item name when it has changed', async () => {
        store.items.item1.name = 'Old Name'
        store.items.item1.properties.name = {
          value: 'New Name',
          type: 'text',
          label: 'Name'
        }

        await wrapper.vm.$nextTick()
        await wrapper.vm.$nextTick()

        expect(store.setItemName).toHaveBeenCalledWith(item1, 'New Name')
      })
    })

    describe('when the item has variable input ports that have changed', () => {
      it('should update the size when the number of input ports changes', async () => {
        stubAll(store, [
          'setItemSize',
          'setInputCount'
        ])

        const newValue = 3

        store.items.item1.properties = {
          inputCount: {
            value: 2,
            type: 'number',
            label: 'Input Count'
          }
        }

        await wrapper.vm.$nextTick()
        vi.resetAllMocks()

        store.items.item1.properties.inputCount!.value = newValue

        await wrapper.vm.$nextTick()

        expect(store.setInputCount).toHaveBeenCalledWith('item1', newValue)
        expect(store.setItemSize).toHaveBeenCalledWith({
          id: 'item1',
          rect: expect.any(Object)
        })
      })
    })

    describe('when the item has a clock whose frequency has changed', () => {
      it('should update the size when the frequency changes', async () => {
        const newValue = 500
        const oldValue = 1000

        store.items.item1.clock = new ClockPulse('item1', oldValue, LogicValue.FALSE, LogicValue.FALSE)
        store.items.item1.properties = {
          interval: {
            value: oldValue,
            type: 'number',
            label: 'Frequency'
          }
        }

        await wrapper.vm.$nextTick()
        vi.resetAllMocks()

        store.items.item1.properties.interval!.value = newValue

        await wrapper.vm.$nextTick()

        expect(store.items.item1.clock.interval).toEqual(newValue)
      })
    })
  })

  describe('the properties button', () => {
    it('should be visible on a selected item', async () => {
      store.selectedItemIds = new Set(['item1'])

      await wrapper.setProps({ isSelected: true })

      expect(wrapper.findComponent({ name: 'Properties' }).exists()).toBe(true)
    })

    it('should not be visible on a non-selected item', async () => {
      await wrapper.setProps({ isSelected: false })

      expect(wrapper.findComponent({ name: 'Properties' }).exists()).toBe(false)
    })

    it('should not be visible when multiple items are selected', async () => {
      store.selectedItemIds = new Set(['item1', 'item2'])
      await wrapper.setProps({ isSelected: true })

      expect(wrapper.findComponent({ name: 'Properties' }).exists()).toBe(false)
    })
  })

  describe('when the item is double-clicked', () => {
    it('should reveal the custom circuit, if it exists', async () => {
      const rootStore = useRootStore()

      stubAll(rootStore, ['openIntegratedCircuit'])

      item1.subtype = ItemSubtype.CustomCircuit
      await wrapper.trigger('dblclick')

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

  it('should blur the element if it is focused', async () => {
    const spy = vi.spyOn(wrapper.vm.$el, 'blur')

    vi
      .spyOn(document, 'activeElement', 'get')
      .mockReturnValue(wrapper.vm.$el)

    await wrapper
      .find('.port-handle')
      .trigger('keydown.esc')

    await new Promise(r => setTimeout(r))

    expect(spy).toHaveBeenCalled()
  })

  it('should show the hue of the port if it is monitored', async () => {
    const portHandle = await wrapper.findComponent({ name: 'PortHandle' })

    expect(portHandle.props().hue).toEqual(port1.hue)
  })

  it('should save preview a connection from a port when the space bar is hit', async () => {
    stubAll(store, ['cycleConnectionPreviews'])

    await wrapper
      .find('.port-handle')
      .trigger('keydown.space')

    expect(store.cycleConnectionPreviews).toHaveBeenCalledTimes(1)
    expect(store.cycleConnectionPreviews).toHaveBeenCalledWith('port1')
  })

  it('should save the previewed connection generated on a port when the enter key is hit', async () => {
    stubAll(store, ['commitPreviewedConnection'])

    await wrapper
      .find('.port-handle')
      .trigger('keydown.enter')

    expect(store.commitPreviewedConnection).toHaveBeenCalledTimes(1)
  })

  it('should save the previewed connection generated on a port when the enter key is hit', async () => {
    stubAll(store, ['commitPreviewedConnection'])

    await wrapper
      .find('.port-handle')
      .trigger('keydown.enter')

    expect(store.commitPreviewedConnection).toHaveBeenCalledTimes(1)
  })

  it('should set the active port ID when its context menu is shown', async () => {
    stubAll(store, ['setActivePortId'])

    await wrapper
      .find('.port-handle')
      .trigger('contextmenu')

    expect(store.setActivePortId).toHaveBeenCalledTimes(1)
    expect(store.setActivePortId).toHaveBeenCalledWith('port1')
  })

  it('should set the active port ID when a port is focused', async () => {
    stubAll(store, ['setActivePortId'])

    await wrapper
      .find('.port-handle')
      .trigger('focus')

    expect(store.setActivePortId).toHaveBeenCalledTimes(1)
    expect(store.setActivePortId).toHaveBeenCalledWith('port1')
  })

  it('should clear the active port ID when a port is blurred', async () => {
    stubAll(store, ['unsetActivePortId'])

    store.activePortId = 'port1'

    await wrapper
      .find('.port-handle')
      .trigger('blur')

    expect(store.unsetActivePortId).toHaveBeenCalledTimes(1)
    expect(store.unsetActivePortId).toHaveBeenCalledWith('port1')
  })

  describe('when the item is right-clicked', () => {
    const $event = new MouseEvent('contextmenu')

    beforeEach(() => stubAll(store, ['setItemSelectionState']))

    it('should select the item if not already selected', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('contextmenu', $event)

      expect(store.setItemSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setItemSelectionState).toHaveBeenCalledWith('item1', true)
    })

    it('should not select the item if it is already selected', async () => {
      await wrapper.setProps({ isSelected: true })
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('contextmenu', $event)

      expect(store.setItemSelectionState).not.toHaveBeenCalled()
    })

    it('should emit `contextmenu`', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('contextmenu', $event)

      expect(wrapper.emitted()).toHaveProperty('contextmenu')
      expect(wrapper.emitted().contextmenu[0]).toEqual([$event])
    })
  })

  describe('when the draggable element emits a selection gesture', () => {
    beforeEach(() => {
      stubAll(store, [
        'setItemSelectionState',
        'deselectAll'
      ])
    })

    it('should select the item', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('select')

      expect(store.setItemSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setItemSelectionState).toHaveBeenCalledWith('item1', true)
    })

    it('should deselect other elements when the draggable component indicated to do so', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('select', true)

      expect(store.deselectAll).toHaveBeenCalledTimes(1)
    })

    it('should not deselect other elements when the draggable component did not indicate to do so', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('select')

      expect(store.deselectAll).not.toHaveBeenCalled()
    })
  })
})
