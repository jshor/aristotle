import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createControlPoint,
  createGroup,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import { usePreferencesStore } from '@/store/preferences'
import SnapMode from '@/types/enums/SnapMode'
import Point from '@/types/interfaces/Point'

setActivePinia(createPinia())

describe('positioning actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('centerAll', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.InputNode, {
      position: {
        x: 30,
        y: 30
      },
      width: 200,
      height: 200
    })
    const item2 = createItem('item2', ItemType.OutputNode, {
      position: {
        x: 60,
        y: 60
      },
      width: 150,
      height: 150
    })

    beforeEach(() => {
      stubAll(store, [
        'setItemPosition'
      ])

      store.$reset()
      store.canvas = {
        left: -100,
        top: -100,
        right: 500,
        bottom: 500
      }
      store.items = { item1, item2 }
      store.centerAll()
    })

    it('should set the position of each item relative to its centered, parent group position', () => {
      expect(store.setItemPosition).toHaveBeenCalledTimes(2)
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item1',
        position: {
          x: 330,
          y: 330
        }
      })
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item2',
        position: {
          x: 360,
          y: 360
        }
      })
    })
  })

  describe('setItemPosition', () => {
    it('should set the port position', () => {
      const portId = 'port1'
      const position = { x: 20, y: 30 }
      const store = createDocumentStore('document')()
      const port = createPort(portId, 'item', PortType.Input, {
        position: {
          x: 10,
          y: 10
        }
      })

      store.$patch({
        ports: {
          [portId]: port
        },
        canvas: {
          left: 0,
          top: 0,
          right: 1000,
          bottom: 1000
        },
        viewport: {
          width: 1000,
          height: 1000,
          x: 0,
          y: 0
        }
      })
      store.setPortRelativePosition(position, portId)

      expect(port.position).toEqual(position)
    })
  })

  describe('setItemPosition', () => {
    const store = createDocumentStore('document')()
    const position = { x: 210, y: 452 }
    const item1 = createItem('item1', ItemType.LogicGate, {
      portIds: ['port1'],
      position: { x: 10, y: 25 }
    })
    const port1 = createPort('port1', 'item1', PortType.Input, {
      position: { x: 10, y: 25 }
    })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1 },
        ports: { port1 }
      })
      store.setItemPosition({ id: 'item1', position })
    })

    it('should update the item\'s position to the new one provided', () => {
      expect(store.items[item1.id].position).toEqual(position)
    })

    it('should move the bounding box of the item to the distance changed', () => {
      expect(store.items[item1.id].boundingBox).toEqual({
        left: item1.boundingBox.left + (position.x - item1.position.x),
        top: item1.boundingBox.top + (position.y - item1.position.y),
        right: item1.boundingBox.left + (position.x - item1.position.x),
        bottom: item1.boundingBox.bottom + (position.y - item1.position.y)
      })
    })

    it('should update the position of the ports according to the distance changed', () => {
      expect(store.ports[port1.id].position).toEqual({
        x: port1.position.x + (position.x - item1.position.x),
        y: port1.position.y + (position.y - item1.position.y)
      })
    })
  })

  describe('dragItem', () => {
    const store = createDocumentStore('document')()
    const preferencesStore = usePreferencesStore()
    const item = createItem('item', ItemType.LogicGate, {
      width: 100,
      height: 100
    })

    beforeEach(() => {
      preferencesStore.$reset()
      store.$reset()
      store.$patch({
        canvas: {
          left: 0,
          top: 0,
          right: 1000,
          bottom: 1000
        },
        viewport: {
          width: 1000,
          height: 1000,
          x: 0,
          y: 0
        },
        items: { item }
      })

      stubAll(store, [
        'setSelectionPosition'
      ])
    })

    it('should update the position without snapping to anything', () => {
      const position = { x: 15, y: 15 }

      preferencesStore.snapping.snapToGrid.value = false
      preferencesStore.snapping.snapToAlign.value = false

      store.dragItem('item', position)

      expect(store.setSelectionPosition).toHaveBeenCalledWith(expect.objectContaining(position))
    })

    it('should snap the item to a nearby snap boundary', () => {
      const boundaryX = 20

      preferencesStore.snapping.snapToAlign.value = true
      preferencesStore.snapping.snapTolerance.value = 10

      store.snapBoundaries = [{
        left: item.width + boundaryX,
        top: 0,
        right: 1000,
        bottom: Infinity
      }]
      store.dragItem('item', { x: 15, y: 15 })

      expect(store.setSelectionPosition).toHaveBeenCalledWith(expect.objectContaining({ x: boundaryX }))
    })

    it('should snap the item to a nearby grid line', () => {
      preferencesStore.snapping.snapToGrid.value = true
      preferencesStore.snapping.snapTolerance.value = 10
      preferencesStore.grid.gridSize.value = 10

      store.dragItem('item', { x: 15, y: 15 })

      expect(store.setSelectionPosition).toHaveBeenCalledWith(expect.objectContaining({ x: 20, y: 20 }))
    })

    it('should snap to a radial boundary', () => {
      const x = 20
      const y = 20
      const item = createItem('item', ItemType.InputNode, { width: 0, height: 0 })

      preferencesStore.snapping.snapTolerance.value = 20
      store.$patch({
        items: {
          item
        }
      })
      store.snapBoundaries = [{
        left: item.width + x,
        top: item.height + y,
        right: item.width + x,
        bottom: item.height + y
      }]
      store.dragItem('item', { x: 15, y: 15 }, SnapMode.Radial)

      expect(store.setSelectionPosition).toHaveBeenCalledWith(expect.objectContaining({ x, y }))
    })
  })

  describe('dragControlPoint', () => {
    const store = createDocumentStore('document')()
    const position = {
      x: 4,
      y: 7
    }
    const offset = {
      x: 1,
      y: 2
    }
    const newPosition = {
      x: position.x - offset.x,
      y: position.y - offset.y
    }
    const oldPosition = {
      x: 11,
      y: 23
    }
    const controlPoint1 = createControlPoint({ position: oldPosition })

    beforeEach(() => {
      stubAll(store, ['dragTarget'])

      store.$reset()
      store.$patch({
        connections: {
          connection1: createConnection('connection1', 'item1', 'item2', {
            controlPoints: [controlPoint1]
          })
        },
        selectedControlPoints: {
          connection1: new Set([0])
        }
      })
    })

    it('should drag the control point to the given position', () => {
      store.dragControlPoint('connection1', position, offset, 0)

      expect(store.dragTarget).toHaveBeenCalledWith(
        expect.objectContaining({
          left: newPosition.x,
          top: newPosition.y,
          right: newPosition.x,
          bottom: newPosition.y
        }),
        oldPosition,
        newPosition,
        SnapMode.Outer
      )
    })


    it('should not snap the control point if multiple elements are being dragged', () => {
      store.selectedItemIds.add('item1')
      store.dragControlPoint('connection1', position, offset, 0)

      expect(store.dragTarget).toHaveBeenCalledWith(
        expect.objectContaining({
          left: newPosition.x,
          top: newPosition.y,
          right: newPosition.x,
          bottom: newPosition.y
        }),
        oldPosition,
        newPosition,
        undefined
      )
    })
  })

  describe('setSelectionPosition', () => {
    const store = createDocumentStore('document')()
    const oldPosition: Point = { x: 10, y: 24 }
    const position: Point = { x: 7, y: 49 }
    const delta: Point = {
      x: position.x - oldPosition.x,
      y: position.y - oldPosition.y
    }
    const item1 = createItem('item1', ItemType.LogicGate, { position: oldPosition, isSelected: true })
    const item2 = createItem('item2', ItemType.InputNode, { groupId: 'group1', isSelected: true })
    const group1 = createGroup('group1', ['item1', 'item2'])

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2 },
        groups: { group1 },
      })

      stubAll(store, [
        'setItemPosition'
      ])
    })

    it('should set the position of each selected item according to the delta moved', () => {
      store.$patch({
        selectedItemIds: new Set(['item1', 'item2'])
      })
      store.setSelectionPosition(delta)

      expect(store.setItemPosition).toHaveBeenCalledTimes(2)
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item1',
        position: {
          x: item1.position.x + delta.x,
          y: item1.position.y + delta.y
        }
      })
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item2',
        position: {
          x: item2.position.x + delta.x,
          y: item2.position.y + delta.y
        }
      })
    })

    it('should set the position of each selected control point according to the delta moved', () => {
      const controlPoint1Position = { x: 6, y: 11 }
      const controlPoint2Position = { x: 8, y: 42 }
      const controlPoint1 = createControlPoint({ position: controlPoint1Position })
      const controlPoint2 = createControlPoint({ position: controlPoint2Position })

      store.$patch({
        selectedControlPoints: {
          connection1: new Set([1, 0])
        },
        connections: {
          connection1: createConnection('connection1', 'item1', 'item2', {
            controlPoints: [controlPoint1, controlPoint2]
          })
        }
      })

      store.setSelectionPosition(delta)

      expect(controlPoint1.position).toEqual({
        x: controlPoint1Position.x + delta.x,
        y: controlPoint1Position.y + delta.y
      })
      expect(controlPoint2.position).toEqual({
        x: controlPoint2Position.x + delta.x,
        y: controlPoint2Position.y + delta.y
      })
    })
  })

})
