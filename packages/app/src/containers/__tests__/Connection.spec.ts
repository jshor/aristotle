import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { StoreDefinition } from 'pinia'
import { createDocumentStore } from '@/store/document'
import DocumentState from '@/store/DocumentState'
import { createItem, createPort } from '@/store/__tests__/__helpers__/helpers'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import Direction from '@/types/enums/Direction'
import Connection from '../Connection.vue'

describe('Connection.vue', () => {
  const connectionId = 'connection-id'
  const pinia = createTestingPinia()
  const storeInstance = createDocumentStore('document')
  const store = storeInstance()

  let wrapper: VueWrapper

  beforeEach(() => {
    const source = createPort('source', 'item-id', PortType.Output, { x: 10, y: 20 })
    const target = createPort('target', 'item-id', PortType.Input, { x: 30, y: 40 })

    store.ports = { source, target }

    wrapper = mount(Connection, {
      global: {
        plugins: [pinia]
      },
      props: {
        store: storeInstance,
        id: connectionId,
        sourceId: source.id,
        targetId: target.id,
        connectionChainId: connectionId
      },
      attachTo: document.body
    })
  })

  afterEach(() => jest.resetAllMocks())

  describe('when the mouse is down', () => {
    beforeEach(() => {
      jest
        .spyOn(store, 'selectItem')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store, 'deselectItem')
        .mockImplementation(jest.fn())
    })

    it('should select the connection when not already selected', async () => {
      await wrapper.setProps({ isSelected: true })
      await wrapper
        .find('[data-test="wire"]')
        .trigger('mousedown')

        expect(store.deselectItem).toHaveBeenCalledTimes(1)
        expect(store.deselectItem).toHaveBeenCalledWith(connectionId)
    })

    it('should select the connection when not selected', async () => {
      await wrapper.setProps({ isSelected: false })
      await wrapper
        .find('[data-test="wire"]')
        .trigger('mousedown')

        expect(store.selectItem).toHaveBeenCalledTimes(1)
        expect(store.selectItem).toHaveBeenCalledWith(connectionId, false)
    })

    it('should neither select nor de-select the connection if it is part of a group', async () => {
      await wrapper.setProps({ groupId: 'group-id' })
      await wrapper
        .find('[data-test="wire"]')
        .trigger('mousedown')

        expect(store.selectItem).not.toHaveBeenCalled()
        expect(store.deselectItem).not.toHaveBeenCalled()
    })
  })

  describe('when the mouse moves', () => {
    beforeEach(() => {
      jest
        .spyOn(store, 'createFreeport')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store, 'setSnapBoundaries')
        .mockImplementation(jest.fn())
    })

    it('should create a new freeport when the mouse moves after the left mouse button is down', async () => {
      await window.dispatchEvent(new MouseEvent('mousedown'))

      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 10,
        clientY: 22
      }))

      expect(store.createFreeport).toHaveBeenCalled()
      expect(store.setSnapBoundaries).toHaveBeenCalled()
    })

    it('should not create a new freeport after the mouse moves multiple times', async () => {
      await window.dispatchEvent(new MouseEvent('mousedown'))

      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 10,
        clientY: 22
      }))
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 15,
        clientY: 24
      }))

      expect(store.createFreeport).not.toHaveBeenCalled()
      expect(store.setSnapBoundaries).not.toHaveBeenCalled()
    })

    it('should not create a new freeport if the component has been destroyed', async () => {
      await window.dispatchEvent(new MouseEvent('mousedown'))

      wrapper.unmount()
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 10,
        clientY: 22
      }))

      expect(store.createFreeport).not.toHaveBeenCalled()
      expect(store.setSnapBoundaries).not.toHaveBeenCalled()
    })
  })

  describe('when the mouse button is released', () => {
    describe('when the mouse is down', () => {
      beforeEach(async () => {
        jest
          .spyOn(store, 'createFreeport')
          .mockImplementation(jest.fn())

        await wrapper
          .find('[data-test="wire"]')
          .trigger('mousedown')

        await window.dispatchEvent(new MouseEvent('mouseup'))
      })

      it('should not allow further mouse movement to trigger a freeport creation', async () => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 10,
          clientY: 22
        }))

        expect(store.createFreeport).not.toHaveBeenCalled()
        expect(store.setSnapBoundaries).not.toHaveBeenCalled()
      })
    })

    it('should not emit `select` if the mouse is not already down', async () => {
      await window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted()).not.toHaveProperty('select')
    })
  })

  describe('when the connection is focused', () => {
    beforeEach(() => {
      jest
        .spyOn(store, 'selectItem')
        .mockImplementation(jest.fn())

      jest.useFakeTimers()
    })

    afterEach(() => jest.useRealTimers())

    it('should select the connection when not selected', async () => {
      await wrapper.setProps({ isSelected: false })
      await wrapper
        .find('[data-test="wire"]')
        .trigger('focus')

      jest.advanceTimersByTime(10)

      expect(store.selectItem).toHaveBeenCalledTimes(1)
      expect(store.selectItem).toHaveBeenCalledWith(connectionId)
    })

    it('should not select the connection when it is already selected', async () => {
      await wrapper.setProps({ isSelected: true })
      await wrapper
        .find('[data-test="wire"]')
        .trigger('focus')

      jest.advanceTimersByTime(10)

      expect(store.selectItem).not.toHaveBeenCalled()
    })
  })
})
