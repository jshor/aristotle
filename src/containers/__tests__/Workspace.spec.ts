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

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

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
