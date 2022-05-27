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
  const touchEvent = {
    touches: [{ clientX: 10, clientY: 11 }]
  }

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
  })

  describe('when the mouse moves', () => {
    beforeEach(() => {
      jest
        .spyOn(store, 'createFreeport')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store, 'dragItem')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store, 'setSnapBoundaries')
        .mockImplementation(jest.fn())
    })

    it('should create a new freeport when the mouse moves after the left mouse button is down', async () => {
      await wrapper
        .find('[data-test="wire"]')
        .trigger('mousedown')

      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 10,
        clientY: 22
      }))

      expect(store.createFreeport).toHaveBeenCalled()
      expect(store.setSnapBoundaries).toHaveBeenCalled()
    })

    it('should not create a new freeport if the component has been destroyed', async () => {
      await wrapper
        .find('[data-test="wire"]')
        .trigger('mousedown')

      wrapper.unmount()
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 10,
        clientY: 22
      }))

      expect(store.createFreeport).not.toHaveBeenCalled()
      expect(store.setSnapBoundaries).not.toHaveBeenCalled()
    })

    it('should drag the newly-created freeport after the mouse moves again after creating a freeport', async () => {
      await wrapper
        .find('[data-test="wire"]')
        .trigger('mousedown')

      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 10,
        clientY: 22
      }))
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 15,
        clientY: 24
      }))

      expect(store.dragItem).toHaveBeenCalled()
    })
  })

  describe('when the connection is physically touched', () => {
    beforeEach(() => {
      jest
        .spyOn(store, 'selectItem')
        .mockImplementation(jest.fn())
    })

    describe('when touched for the duration of the touch timeout limit', () => {
      beforeEach(async () => {
        navigator.vibrate = jest.fn()

        jest.useFakeTimers()
        jest
          .spyOn(navigator, 'vibrate')
          .mockImplementation(jest.fn())

        await wrapper.setProps({ isMobile: true })
        await wrapper
          .find('[data-test="wire"]')
          .trigger('touchstart', {
            touches: [{ clientX: 10, clientY: 11 }]
          })

        jest.advanceTimersByTime(1000)
      })

      afterEach(() => jest.useRealTimers())

      it('should select the connection while maintaining other selections', () => {
        expect(store.selectItem).toHaveBeenCalledTimes(1)
        expect(store.selectItem).toHaveBeenCalledWith(connectionId, true)
      })

      it('should vibrate the device', () => {
        expect(navigator.vibrate).toHaveBeenCalledTimes(1)
        expect(navigator.vibrate).toHaveBeenCalledWith(100)
      })
    })

    describe('when touched once before the touch timeout passes', () => {
      it('should select the connection while maintaining other selections', async () => {
        await wrapper
          .find('[data-test="wire"]')
          .trigger('touchstart', touchEvent)

        expect(store.selectItem).toHaveBeenCalledTimes(1)
        expect(store.selectItem).toHaveBeenCalledWith(connectionId, true)
      })
    })
  })

  describe('when dragged by a physical touch', () => {
    const touchMoveEvent = {
      touches: [{ clientX: 14, clientY: 19 }]
    }

    beforeEach(() => {
      jest
        .spyOn(store, 'createFreeport')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store, 'setSnapBoundaries')
        .mockImplementation(jest.fn())
    })

    it('should create a new freeport', async () => {
      await wrapper
        .find('[data-test="wire"]')
        .trigger('touchstart', touchEvent)
      await wrapper
        .find('[data-test="wire"]')
        .trigger('touchmove', touchMoveEvent)

      expect(store.createFreeport).toHaveBeenCalled()
    })

    it('should not create a new freeport when the connection is part of a group', async () => {
      await wrapper.setProps({ groupId: 'group-id' })
      await wrapper
        .find('[data-test="wire"]')
        .trigger('touchstart', touchEvent)
      await wrapper
        .find('[data-test="wire"]')
        .trigger('touchmove', touchMoveEvent)

      expect(store.createFreeport).not.toHaveBeenCalled()
    })

    it('should not change the selection when the touch moves', async () => {
      jest
        .spyOn(store, 'selectItem')
        .mockImplementation(jest.fn())

      await wrapper.setProps({ isMobile: true })
      await wrapper
        .find('[data-test="wire"]')
        .trigger('touchstart', touchEvent)
      await wrapper
        .find('[data-test="wire"]')
        .trigger('touchmove', touchMoveEvent)
      await wrapper
        .find('[data-test="wire"]')
        .trigger('touchend', touchEvent)

      expect(store.selectItem).not.toHaveBeenCalled()
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
