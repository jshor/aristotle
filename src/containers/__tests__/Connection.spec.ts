import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ConnectionComponent from '../Connection.vue'
import { createDocumentStore, DocumentStore, DocumentStoreInstance } from '@/store/document'
import { createConnection, createControlPoint, createPort, stubAll } from '@/store/document/actions/__tests__/__helpers__'
import PortType from '@/types/enums/PortType'
import Port from '@/types/interfaces/Port'
import Connection from '@/types/interfaces/Connection'

setActivePinia(createPinia())

describe('Item container', () => {
  let wrapper: VueWrapper
  let storeDefinition: DocumentStore
  let store: DocumentStoreInstance
  let source: Port
  let target: Port
  let connection: Connection

  const connectionId = 'connection'
  const props = {
    zIndex: 1,
    isSelected: true,
    id: connectionId,
    flash: false
  }

  beforeEach(() => {
    storeDefinition = createDocumentStore('test-id')
    store = storeDefinition()

    source = createPort('source', 'item', PortType.Input, { name: 'Source Port' })
    target = createPort('target', 'item', PortType.Input, { name: 'Target Port' })
    connection = createConnection(connectionId, source.id, target.id)

    store.connections = { connection }
    store.ports = { source, target }

    wrapper = mount(ConnectionComponent, {
      props: {
        ...props,
        store: storeDefinition
      }
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should match the snapshot', async () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('when the centroid is focused', () => {
    beforeEach(async () => {
      stubAll(store, [
        'deselectAll',
        'setConnectionSelectionState'
      ])

      await wrapper
        .find('[data-test="centroid"]')
        .trigger('focus')
    })

    it('should select the connection', () => {
      expect(store.setConnectionSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connectionId, true)
    })

    it('should show the bounding box', () => {
      expect(wrapper.find('[data-test="bounding-box"]').exists()).toBe(true)
    })

    it('should deselect all other items', () => {
      expect(store.deselectAll).toHaveBeenCalledTimes(1)
    })

    it('should hide the bounding box when the centroid is blurred', async () => {
      await wrapper
        .find('[data-test="centroid"]')
        .trigger('blur')

      expect(wrapper.find('[data-test="bounding-box"]').exists()).toBe(false)
    })
  })

  describe('when dragging a wire', () => {
    const position = { x: 10, y: 20 }
    const index = 0

    beforeEach(() => {
      stubAll(store, [
        'cacheState',
        'deselectAll',
        'setControlPointSnapBoundaries',
        'setSelectionPosition',
        'addControlPoint',
        'dragControlPoint'
      ])
    })

    it('should move the new control point to the emitted position', async () => {
      await wrapper
        .findComponent({ name: 'WireDraggable' })
        .vm
        .$emit('dragStart', position)
      await wrapper
        .findComponent({ name: 'WireDraggable' })
        .vm
        .$emit('move', position)

      expect(store.dragControlPoint).toHaveBeenCalledTimes(1)
      expect(store.dragControlPoint).toHaveBeenCalledWith(connectionId, position, index)
    })

    it('snap', () => {
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('should move the entire selection when it is part of a group', async () => {
      const startPosition = { x: 1, y: 5 }
      const movePosition = { x: 10, y: 20 }

      store.connections[connectionId].groupId = 'group-id'
      store.zoomLevel = 1.2

      await wrapper
        .findComponent({ name: 'WireDraggable' })
        .vm
        .$emit('move', startPosition)

      expect(store.setSelectionPosition).toHaveBeenCalledTimes(1)
      expect(store.setSelectionPosition).toHaveBeenCalledWith({
        x: startPosition.x / store.zoomLevel,
        y: startPosition.y / store.zoomLevel
      })

      await wrapper.vm.$nextTick()
      await wrapper
        .findComponent({ name: 'WireDraggable' })
        .vm
        .$emit('move', movePosition)

      expect(store.setSelectionPosition).toHaveBeenCalledTimes(2)
      expect(store.setSelectionPosition).toHaveBeenCalledWith({
        x: (movePosition.x - startPosition.x) / store.zoomLevel,
        y: (movePosition.y - startPosition.y) / store.zoomLevel
      })
    })
  })

  describe('when dragging a control point', () => {
    const position = { x: 10, y: 20 }
    const index = 0

    beforeEach(() => {
      stubAll(store, [
        'cacheState',
        'commitCachedState',
        'deselectAll',
        'setControlPointSnapBoundaries',
        'setSelectionPosition',
        'addControlPoint',
        'dragControlPoint'
      ])

      store.connections[connectionId].controlPoints = [createControlPoint(), createControlPoint()]
    })

    it('should move the new control point to the emitted position', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('dragStart', position)

      expect(store.cacheState).toHaveBeenCalledTimes(1)
      expect(store.setControlPointSnapBoundaries).toHaveBeenCalledTimes(1)
      expect(store.setControlPointSnapBoundaries).toHaveBeenCalledWith(connectionId, expect.any(Array), index)

      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('drag', position)

      expect(store.dragControlPoint).toHaveBeenCalledTimes(1)
      expect(store.dragControlPoint).toHaveBeenCalledWith(connectionId, position, index)

      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('dragEnd', position)

      expect(store.commitCachedState).toHaveBeenCalledTimes(1)
    })

    it('should move the entire selection when the connection is part of a group', async () => {
      const startPosition = { x: 1, y: 5 }
      const movePosition = { x: 10, y: 20 }

      store.connections[connectionId].groupId = 'group-id'
      store.zoomLevel = 1.2

      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('dragStart', startPosition)

      expect(store.cacheState).toHaveBeenCalledTimes(1)

      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('drag', movePosition)

      expect(store.setSelectionPosition).toHaveBeenCalledTimes(1)
      expect(store.setSelectionPosition).toHaveBeenCalledWith({
        x: (movePosition.x - startPosition.x) / store.zoomLevel,
        y: (movePosition.y - startPosition.y) / store.zoomLevel
      })

      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('dragEnd', position)

      expect(store.commitCachedState).toHaveBeenCalledTimes(1)
    })
  })

  describe('context menus', () => {
    describe('when the connection context menu is requested', () => {
      beforeEach(() => {
        stubAll(store, [
          'setConnectionSelectionState'
        ])
      })

      it('should select the connection if it is not already selected', async () => {
        await wrapper.setProps({ isSelected: false })
        await wrapper
          .findComponent({ name: 'WireDraggable' })
          .trigger('contextmenu')

        expect(store.setConnectionSelectionState).toHaveBeenCalledTimes(1)
        expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connectionId, true)
      })

      it('should not select the connection if it is already selected', async () => {
        await wrapper.setProps({ isSelected: true })
        await wrapper
          .findComponent({ name: 'WireDraggable' })
          .trigger('contextmenu')

        expect(store.setConnectionSelectionState).not.toHaveBeenCalled()
      })

      it('should emit the `contextmenu` event', async () => {
        await wrapper
          .findComponent({ name: 'WireDraggable' })
          .trigger('contextmenu')

        expect(wrapper.emitted('contextmenu')).toBeTruthy()
      })
    })

    describe('when a control point context menu is requested', () => {
      beforeEach(() => {
        stubAll(store, [
          'setControlPointSelectionState'
        ])

        store.connections[connectionId].controlPoints = [
          createControlPoint(),
          createControlPoint()
        ]
      })

      it('should select the connection if it is not already selected', async () => {
        store.connections[connectionId].controlPoints[0].isSelected = false

        await wrapper
          .findComponent({ name: 'Draggable' })
          .trigger('contextmenu')

        expect(store.setControlPointSelectionState).toHaveBeenCalledTimes(1)
        expect(store.setControlPointSelectionState).toHaveBeenCalledWith(connectionId, 0, true)
      })

      it('should not select the connection if it is already selected', async () => {
        store.connections[connectionId].controlPoints[0].isSelected = true

        await wrapper
          .findComponent({ name: 'Draggable' })
          .trigger('contextmenu')

        expect(store.setControlPointSelectionState).not.toHaveBeenCalled()
      })

      it('should emit the `contextmenu` event', async () => {
        await wrapper
          .findComponent({ name: 'Draggable' })
          .trigger('contextmenu')

        expect(wrapper.emitted('contextmenu')).toBeTruthy()
      })
    })
  })

  describe('when a wire is selected', () => {
    beforeEach(() => {
      stubAll(store, [
        'deselectAll',
        'setConnectionSelectionState'
      ])
    })

    it('should deselect all items before selecting the control point', async () => {
      await wrapper
        .findComponent({ name: 'WireDraggable' })
        .vm
        .$emit('select', true)

      expect(store.deselectAll).toHaveBeenCalledTimes(1)
      expect(store.setConnectionSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connectionId, true)
    })

    it('should not deselect any items before selecting the control point', async () => {
      await wrapper
        .findComponent({ name: 'WireDraggable' })
        .vm
        .$emit('select', false)

      expect(store.deselectAll).not.toHaveBeenCalled()
      expect(store.setConnectionSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connectionId, true)
    })
  })

  describe('when a control point is selected', () => {
    beforeEach(() => {
      stubAll(store, [
        'deselectAll',
        'setControlPointSelectionState'
      ])

      store.connections[connectionId].controlPoints = [
        createControlPoint(),
        createControlPoint()
      ]
    })
    it('should deselect all items before selecting the control point', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('select', true)

      expect(store.deselectAll).toHaveBeenCalledTimes(1)
      expect(store.setControlPointSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setControlPointSelectionState).toHaveBeenCalledWith(connectionId, 0, true)
    })

    it('should not deselect any items before selecting the control point', async () => {
      await wrapper
        .findComponent({ name: 'Draggable' })
        .vm
        .$emit('select', false)

      expect(store.deselectAll).not.toHaveBeenCalled()
      expect(store.setControlPointSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setControlPointSelectionState).toHaveBeenCalledWith(connectionId, 0, true)
    })
  })
})
