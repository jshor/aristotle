import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import boundaries from '../../geometry/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createItem,
  createPort
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('snapping actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('setSnapBoundaries', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should not apply any snap boundaries for an item that does not exist', () => {
      store.setSnapBoundaries('some-bogus-item-id')

      expect(store.snapBoundaries).toEqual([])
    })

    describe('when there are connectable ports defined', () => {
      it('should return boundaries for each port position', () => {
        const item1 = createItem('item1', ItemType.Freeport)
        const port1 = createPort('port1', 'item1', PortType.Input, { position: { x: 10, y: 20 } })
        const port2 = createPort('port2', 'item2', PortType.Output, { position: { x: 8, y: 42 } })

        store.$patch({
          ports: { port1, port2 },
          items: { item1 },
          connectablePortIds: ['port1', 'port2']
        })

        store.setSnapBoundaries(item1.id)

        expect(store.snapBoundaries).toEqual([
          { left: 10, top: 20, right: 10, bottom: 20 },
          { left: 8, top: 42, right: 8, bottom: 42 }
        ])
      })
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
      describe('when the item is an actively-dragged freeport', () => {
        it('should clear all snap boundaries', () => {
          const itemPort = createPort('itemPort', 'item1', PortType.Output)
          const draggedPort = createPort('draggedPort', '', PortType.Input)
          const connection = createConnection('connection1', itemPort.id, draggedPort.id)
          const freeport = createItem('freeport', ItemType.Freeport, { portIds: ['itemPort'] })

          store.$patch({
            items: { freeport },
            connections: { connection },
            ports: { itemPort, draggedPort },
            connectablePortIds: []
          })
          store.setSnapBoundaries(freeport.id)

          expect(store.snapBoundaries).toEqual([])
        })
      })

      describe('when the item is a non-dragged freeport', () => {
        const sourceValues = [{ left: 1, top: 2, right: 3, bottom: 4 }]
        const targetValues = [{ left: 5, top: 6, right: 7, bottom: 8 }]

        beforeEach(() => {
          const port1 = createPort('port1', 'item1', PortType.Output)
          const port2 = createPort('port1', 'item1', PortType.Input)
          const port3 = createPort('port3', 'item0', PortType.Input)
          const freeportPort1 = createPort('freeportPort1', 'freeport', PortType.Input)
          const freeportPort2 = createPort('freeportPort2', 'freeport', PortType.Output)
          const freeportPort3 = createPort('freeportPort3', 'freeport', PortType.Output)
          const connection1 = createConnection('connection1', port1.id, freeportPort1.id)
          const connection2 = createConnection('connection2', freeportPort2.id, port2.id)
          const connection3 = createConnection('connection2', freeportPort3.id, port3.id)

          const freeport = createItem('freeport', ItemType.Freeport, { portIds: ['freeportPort1', 'freeportPort2'] })
          const item1 = createItem('item1', ItemType.LogicGate, { portIds: ['port1'] })
          const item2 = createItem('item2', ItemType.OutputNode, { portIds: ['port2'] })

          jest
            .spyOn(boundaries, 'getLinearBoundaries')
            .mockReturnValueOnce(sourceValues)
            .mockReturnValueOnce(targetValues)

          store.$patch({
            items: { freeport, item1, item2 },
            connections: { connection1, connection2, connection3 },
            ports: { port1, port2, freeportPort1, freeportPort2 },
            connectablePortIds: []
          })

          store.setSnapBoundaries(freeport.id)
        })

        it('should apply the linear boundaries for the origin item source port', () => {
          expect(store.snapBoundaries).toEqual(expect.arrayContaining(sourceValues))
        })

        it('should apply the linear boundaries for the destination item target port', () => {
          expect(store.snapBoundaries).toEqual(expect.arrayContaining(targetValues))
        })

        it('should only include boundaries for the source and target ports', () => {
          expect(store.snapBoundaries).toEqual([ ...sourceValues, ...targetValues ])
        })
      })

      describe('when the item is not a freeport', () => {
        const bbox1: BoundingBox = { left: 1, top: 2, right: 3, bottom: 4 }
        const bbox2: BoundingBox = { left: 5, top: 6, right: 7, bottom: 8 }
        const bbox3: BoundingBox = { left: 9, top: 10, right: 11, bottom: 12 }
        const bbox4: BoundingBox = { left: 15, top: 16, right: 13, bottom: 14 }

        beforeEach(() => {
          const item1 = createItem('item1', ItemType.LogicGate, { boundingBox: bbox1 })
          const item2 = createItem('item2', ItemType.LogicGate, { boundingBox: bbox2 })
          const item3 = createItem('item3', ItemType.LogicGate, { boundingBox: bbox3 })
          const item4 = createItem('item4', ItemType.Freeport, { boundingBox: bbox4 })

          store.$patch({
            items: { item1, item2, item3, item4 }
          })
          store.setSnapBoundaries(item3.id)
        })

        it('should not apply the bounding box of the item being dragged', () => {
          expect(store.snapBoundaries).toEqual(expect.not.arrayContaining([bbox3]))
        })

        it('should not apply the bounding boxes of any freeports', () => {
          expect(store.snapBoundaries).toEqual(expect.not.arrayContaining([bbox4]))
        })

        it('should apply the bounding boxes of all snappable items', () => {
          expect(store.snapBoundaries).toEqual(expect.arrayContaining([bbox1, bbox2]))
        })
      })
    })
  })
})
