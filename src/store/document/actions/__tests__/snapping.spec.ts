import { setActivePinia, createPinia } from 'pinia'
import ItemType from '@/types/enums/ItemType'
import { createItem, createPort, stubAll } from './__helpers__'
import { createDocumentStore } from '../..'
import BoundingBox from '@/types/types/BoundingBox'
import boundaries from '../../geometry/boundaries'
import PortType from '@/types/enums/PortType'

setActivePinia(createPinia())

describe('snapping actions', () => {
  beforeEach(() => vi.restoreAllMocks())

  describe('setSnapBoundaries', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should not apply any snap boundaries for an item that does not exist', () => {
      store.setSnapBoundaries('some-bogus-item-id')

      expect(store.snapBoundaries).toEqual([])
    })

    it('should not apply any snap boundaries for grouped items', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { groupId: 'group1' })

      store.$patch({
        items: { item1 }
      })
      store.setSnapBoundaries(item1.id)

      expect(store.snapBoundaries).toEqual([])
    })

    describe('when the item is not part of any group', () => {
      const bbox1: BoundingBox = { left: 1, top: 2, right: 3, bottom: 4 }
      const bbox2: BoundingBox = { left: 5, top: 6, right: 7, bottom: 8 }
      const bbox3: BoundingBox = { left: 9, top: 10, right: 11, bottom: 12 }

      beforeEach(() => {
        const item1 = createItem('item1', ItemType.LogicGate, { boundingBox: bbox1 })
        const item2 = createItem('item2', ItemType.LogicGate, { boundingBox: bbox2 })
        const item3 = createItem('item3', ItemType.LogicGate, { boundingBox: bbox3 })

        store.$patch({
          items: { item1, item2, item3 }
        })
        store.setSnapBoundaries(item3.id)
      })

      it('should not apply the bounding box of the item being dragged', () => {
        expect(store.snapBoundaries).toEqual(expect.not.arrayContaining([bbox3]))
      })

      it('should apply the bounding boxes of all snappable items', () => {
        expect(store.snapBoundaries).toEqual(expect.arrayContaining([bbox1, bbox2]))
      })
    })
  })

  describe('setControlPointSnapBoundaries', () => {
    it('should add linear boundaries for non-excluded control points', () => {
      const store = createDocumentStore('document')()
      const source = 'source'
      const target = 'target'
      const portPosition1 = { x: 1, y: 2 }
      const portPosition2 = { x: 3, y: 4 }
      const portPosition3 = { x: 5, y: 6 }
      const portPosition4 = { x: 7, y: 8 }

      store.$patch({
        connections: {
          connection1: { source, target }
        },
        ports: {
          [source]: { position: portPosition1 },
          [target]: { position: portPosition2 }
        }
      })
      store.setControlPointSnapBoundaries('connection1', [
        { portPosition: portPosition3 },
        { portPosition: portPosition4 }
      ], 1)

      expect(store.snapBoundaries).toEqual(expect.arrayContaining(boundaries.getLinearBoundaries(portPosition1)))
      expect(store.snapBoundaries).toEqual(expect.arrayContaining(boundaries.getLinearBoundaries(portPosition2)))
      expect(store.snapBoundaries).toEqual(expect.arrayContaining(boundaries.getLinearBoundaries(portPosition3)))
      expect(store.snapBoundaries).toEqual(expect.not.arrayContaining(boundaries.getLinearBoundaries(portPosition4)))
    })
  })

  describe('setConnectionExperimentSnapBoundaries', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'item1', PortType.Input, { position: { x: 1, y: 2 } })
    const port2 = createPort('port2', 'item1', PortType.Input, { position: { x: 3, y: 4 } })
    const port3 = createPort('port3', 'item1', PortType.Input, { position: { x: 5, y: 6 } })

    beforeEach(() => {
      stubAll(store, [
        'setConnectablePortIds'
      ])

      store.$reset()
      store.$patch({
        ports: { port1, port2, port3 }
      })
      store.connectablePortIds = new Set([port2.id, port3.id])
      store.setConnectionExperimentSnapBoundaries(port1.id)
    })

    it('should set the connectable port IDs', () => {
      expect(store.setConnectablePortIds).toHaveBeenCalledTimes(1)
      expect(store.setConnectablePortIds).toHaveBeenCalledWith({ portId: port1.id, isDragging: true })
    })

    it('should set the point snap boundaries', () => {
      expect(store.snapBoundaries).not.toEqual(expect.arrayContaining([boundaries.getPointBoundary(port1.position)]))
      expect(store.snapBoundaries).toEqual(expect.arrayContaining([boundaries.getPointBoundary(port2.position)]))
      expect(store.snapBoundaries).toEqual(expect.arrayContaining([boundaries.getPointBoundary(port3.position)]))
    })
  })
})
