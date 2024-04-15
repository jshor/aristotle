import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PortItem from '../PortItem.vue'
import { createDocumentStore, DocumentStore, DocumentStoreInstance } from '@/store/document'
import { createPort, stubAll } from '@/store/document/actions/__tests__/__helpers__'
import PortType from '@/types/enums/PortType'
import Port from '@/types/interfaces/Port'
import renderLayout from '@/store/document/geometry/wire'
import Direction from '@/types/enums/Direction'

setActivePinia(createPinia())

describe('Item container', () => {
  let wrapper: VueWrapper<typeof PortItem>
  let storeDefinition: DocumentStore
  let store: DocumentStoreInstance
  let port: Port

  beforeEach(() => {
    storeDefinition = createDocumentStore('test-id')
    store = storeDefinition()

    port = createPort('port', 'item', PortType.Input, { name: 'Test Port' })
    store.ports = { port }

    wrapper = mount(PortItem, {
      props: {
        port,
        store: storeDefinition
      }
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
    store.$reset()
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('port drop activity', () => {
    it('should show the port as active when its ID is the `activePortId`', async () => {
      store.activePortId = port.id
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.port-handle__display--active').exists()).toBe(true)
    })

    it('should not show the port as active when its ID differs from the `activePortId`', async () => {
      store.activePortId = 'some-other-port'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.port-handle__display--active').exists()).toBe(false)
    })

    it('should not show the port as active when there is no active port in the store', async () => {
      store.activePortId = null
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.port-handle__display--active').exists()).toBe(false)
    })
  })

  describe('port monitoring', () => {
    beforeEach(() => {
      stubAll(store, ['togglePortMonitoring'])
    })

    it('should toggle port monitoring when double-clicked', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .trigger('dblclick')

      expect(store.togglePortMonitoring).toHaveBeenCalledTimes(1)
      expect(store.togglePortMonitoring).toHaveBeenCalledWith(port.id)
    })

    it('should toggle port monitoring when double-clicked', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('touchhold', new TouchEvent('touchhold'))

      expect(store.togglePortMonitoring).toHaveBeenCalledTimes(1)
      expect(store.togglePortMonitoring).toHaveBeenCalledWith(port.id)
    })

    it('should show the hue of the port if it is monitored', async () => {
      store.ports[port.id].isMonitored = true
      store.ports[port.id].hue = 250

      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent({ name: 'PortHandle' }).props().hue).toEqual(port.hue)
    })

    it('should set the hue of the port to 0 if it is not monitored', async () => {
      store.ports[port.id].isMonitored = false
      store.ports[port.id].hue = 250

      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent({ name: 'PortHandle' }).props().hue).toEqual(0)
    })
  })

  describe('when a connection experiment is initiated', () => {
    it('should not draw a connection experiment if one is not active', async () => {
      store.connectionExperiment = null

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-test="experiment-wire"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="experiment-port"]').exists()).toBe(false)
    })

    it('should not draw a connection experiment if the current one does not belong to this port', async () => {
      const targetPosition = { x: 100, y: 200 }

      store.connectionExperiment = {
        sourceId: 'some-other-port-id',
        targetPosition
      }

      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-test="experiment-wire"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="experiment-port"]').exists()).toBe(false)
    })

    it('should draw the connection experiment wire and port handle', async () => {
      const targetPosition = { x: 100, y: 200 }

      store.connectionExperiment = {
        sourceId: port.id,
        targetPosition
      }

      await wrapper.vm.$nextTick()

      const wire = wrapper.find('[data-test="experiment-wire"]')
      const handle = wrapper.find('[data-test="experiment-port"]')
      const layout = renderLayout(port, {
        position: targetPosition,
        orientation: Direction.Right,
        rotation: port.rotation,
        canInflect: true
      })

      expect(wrapper.html()).toMatchSnapshot()
      expect(wire.exists()).toBe(true)
      expect(handle.exists()).toBe(true)
      expect(wire.attributes('style')).toContain(`left: ${layout.minX}px`)
      expect(wire.attributes('style')).toContain(`top: ${layout.minY}px`)
      expect(handle.attributes('style')).toContain('left: 100px')
      expect(handle.attributes('style')).toContain('top: 200px')
    })
  })
})
