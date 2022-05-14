import { setActivePinia, createPinia } from 'pinia'
import DocumentState from '../DocumentState'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import boundaries from '@/layout/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createGroup,
  createItem,
  createPort,
} from './__helpers__/helpers'
import { createDocumentStore } from '../document'
import rotation from '@/layout/rotation'
import ItemSubtype from '@/types/enums/ItemSubtype'

const stubAll = (store: any, methods: string[]) => {
  methods.forEach(method => {
    jest
      .spyOn(store, method)
      .mockImplementation(jest.fn())
  })
}

const createSerializedState = () => {
  return JSON.stringify({
    connections: {},
    items: {},
    ports: {},
    groups: {}
  })
}

setActivePinia(createPinia())

describe('actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('incrementZoom', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      jest
        .spyOn(store, 'setZoom')
        .mockImplementation(jest.fn())
    })

    it('should decrement the zoom by one scale measure', () => {
      store.incrementZoom(-1)

      expect(store.setZoom).toHaveBeenCalledTimes(1)
      expect(store.setZoom).toHaveBeenCalledWith({ zoom: 0.9 })
    })

    it('should increment the zoom by one scale measure', () => {
      store.incrementZoom()

      expect(store.setZoom).toHaveBeenCalledTimes(1)
      expect(store.setZoom).toHaveBeenCalledWith({ zoom: 1.1 })
    })
  })

  describe('setZoom', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      jest
        .spyOn(store, 'panTo')
        .mockImplementation(jest.fn())

      store.$reset()
      store.zoomLevel = 1
      store.canvas = {
        left: -100,
        right: -300,
        top: -150,
        bottom: 150
      }
      store.viewport = new DOMRect(100, 50, 300, 250)
    })

    it('should pan to the center of the viewport when a focal point is not defined', () => {
      store.setZoom({ zoom: 1.1 })

      expect(store.panTo).toHaveBeenCalledTimes(1)
      expect(store.panTo).toHaveBeenCalledWith({ x: -100, y: -160 })
    })

    it('should pan to the document-oriented focal point', () => {
      store.setZoom({
        zoom: 1.1,
        point: {
          x: 104,
          y: 117
        }
      })

      expect(store.panTo).toHaveBeenCalledTimes(1)
      expect(store.panTo).toHaveBeenCalledWith({ x: -110, y: -172 })
    })

    it('should set the zoom level to the minimum possible when the desired zoom is below it', () => {
      store.setZoom({ zoom: 0.05 })

      expect(store.zoomLevel).toEqual(0.1)
    })

    it('should set the zoom level to the maximum possible when the desired zoom exceeds it', () => {
      store.setZoom({ zoom: 2.05 })

      expect(store.zoomLevel).toEqual(2)
    })
  })

  describe('setViewerSize', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'centerAll',
        'panToCenter'
      ])
    })

    it('should canvas size according to the screen size', () => {
      const rect = new DOMRect(10, 20, 100, 200)

      store.setViewerSize(rect)

      expect(store.viewport).toEqual(rect)
      expect(store.canvas.right).toEqual(screen.width / 0.1)
      expect(store.canvas.bottom).toEqual(screen.height / 0.1)
    })

    it('should pan and center items when the dimensions are set and the document has not yet loaded', () => {
      store.setViewerSize(new DOMRect(10, 20, 100, 200))

      expect(store.hasLoaded).toEqual(true)
      expect(store.centerAll).toHaveBeenCalledTimes(1)
      expect(store.panToCenter).toHaveBeenCalledTimes(1)
    })

    it('should not pan or center items when the document has already loaded', () => {
      store.hasLoaded = true
      store.setViewerSize(new DOMRect(10, 20, 100, 200))

      expect(store.centerAll).not.toHaveBeenCalled()
      expect(store.panToCenter).not.toHaveBeenCalled()
    })

    it('should not pan or center items when the width is not defined', () => {
      store.setViewerSize(new DOMRect(0, 0, 0, 0))

      expect(store.centerAll).not.toHaveBeenCalled()
      expect(store.panToCenter).not.toHaveBeenCalled()
    })

    it('should not pan or center items when the height is not defined', () => {
      store.setViewerSize(new DOMRect(10, 0, 100, 0))

      expect(store.centerAll).not.toHaveBeenCalled()
      expect(store.panToCenter).not.toHaveBeenCalled()
    })
  })

  describe('panTo', () => {
    it('should update the canvas to move to the given panning point', () => {
      const store = createDocumentStore('document')()

      store.canvas = {
        left: -200,
        top: -200,
        right: 703,
        bottom: 918
      }
      store.panTo({ x: 200, y: 18 })

      expect(store.canvas).toEqual({
        left: 200,
        top: 18,
        right: 1103,
        bottom: 1136
      })
    })
  })

  describe('panToCenter', () => {
    it('should pan to the center of the canvas', () => {
      const store = createDocumentStore('document')()

      store.canvas = {
        left: -200,
        top: -300,
        right: 4200,
        bottom: 1900
      }
      store.viewport = new DOMRect(20, 20, 200, 300)
      store.panToCenter()

      expect(store.canvas).toEqual({
        left: -2100,
        top: -950,
        right: 2300,
        bottom: 1250
      })
    })
  })

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
        'setItemPosition',
        'setItemPortPositions'
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

    it('should update the port positions of each item', () => {
      expect(store.setItemPortPositions).toHaveBeenCalledTimes(2)
      expect(store.setItemPortPositions).toHaveBeenCalledWith('item1')
      expect(store.setItemPortPositions).toHaveBeenCalledWith('item2')
    })
  })

  describe('undo', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'applyState'
      ])
    })

    describe('when an available state exists in the undo stack', () => {
      const undoState = createSerializedState()

      beforeEach(() => {
        store.$patch({
          undoStack: [undoState]
        })
        store.undo()
      })

      it('should commit the state to the redo stack', () => {
        expect(store.redoStack).toHaveLength(1)
      })

      it('should apply the undo-able state on the top of the undo stack', () => {
        expect(store.applyState).toHaveBeenCalledTimes(1)
        expect(store.applyState).toHaveBeenCalledWith(undoState)
      })

      it('should remove the redo-able state from the top of the redo stack', () => {
        expect(store.undoStack).toHaveLength(0)
      })
    })

    it('should not commit anything to the store if the undo stack is empty', () => {
      store.$reset()
      store.undo()

      expect(store.redoStack).toHaveLength(0)
      expect(store.applyState).not.toHaveBeenCalled()
    })
  })

  describe('redo', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'applyState'
      ])
    })

    describe('when an available state exists in the undo stack', () => {
      const redoState = createSerializedState()

      beforeEach(() => {
        store.$patch({
          redoStack: [redoState]
        })
        store.redo()
      })

      it('should commit the state back to the undo stack', () => {
        expect(store.undoStack).toHaveLength(1)
      })

      it('should apply the undo-able state on the top of the redo stack', () => {
        expect(store.applyState).toHaveBeenCalledWith(redoState)
      })

      it('should remove the redo-able state from the top of the redo stack', () => {
        expect(store.redoStack).toHaveLength(0)
      })
    })

    it('should not commit anything to the store if the redo stack is empty', () => {
      store.redo()

      expect(store.undoStack).toHaveLength(0)
      expect(store.applyState).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelection', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        connections: {
          'connection1': createConnection('connection1', 'port1', 'port2'),
          'connection2': createConnection('connection2', 'port3', 'port4'),
          'connection3': createConnection('connection3', 'port5', 'port6', { isSelected: true }),
          'dragged_connection1': createConnection('dragged_connection', 'port6', 'port7'),
          'dragged_connection2': createConnection('dragged_connection', 'port8', 'port9')
        },
        ports: {
          'port1': createPort('port1', 'item1', PortType.Output),
          'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
          'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true }),
          'port4': createPort('port4', 'item2', PortType.Input),
          'port5': createPort('port5', 'item3', PortType.Input),
          'port6': createPort('port6', 'item4', PortType.Output)
        },
        items: {
          'item1': createItem('item1', ItemType.InputNode, { portIds: ['port1'], isSelected: true }),
          'item2': createItem('item2', ItemType.OutputNode, { portIds: ['port4'] }),
          'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'], isSelected: true }),
          'item3': createItem('item3', ItemType.InputNode, { portIds: ['port5'] }),
          'item4': createItem('item4', ItemType.OutputNode, { portIds: ['port6'] }),
          'ic': createItem('ic', ItemType.IntegratedCircuit, {
            portIds: ['icPort'],
            isSelected: true,
            integratedCircuit: {
              items: {
                icNode: createItem('icNode', ItemType.InputNode)
              }
            }
          })
        }
      })

      stubAll(store, [
        'commitState',
        'setSelectionState',
        'removeFreeport',
        'disconnect',
        'removeElement',
      ])
    })

    describe('when there are one or more items selected', () => {
      beforeEach(() => {
        store.selectedItemIds = ['item1']
        store.deleteSelection()
      })

      it('should commit the current state to the undo stack', () => {
        expect(store.commitState).toHaveBeenCalledTimes(1)
      })

      it('should select all connections that are attached to selected non-freeport items', () => {
        expect(store.setSelectionState).toHaveBeenCalledWith({ id: 'connection1', value: true })
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'connection3', value: true })
      })

      it('should not select connections attached to a freeport', () => {
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'connection2', value: true })
      })

      it('should not select a connection with an invalid source port reference', () => {
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'dragged_connection1', value: true })
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'dragged_connection2', value: true })
      })

      it('should disconnect selected connections', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port5', target: 'port6' })
      })

      it('should remove selected non-freeport items', () => {
        expect(store.removeElement).toHaveBeenCalledWith('item1')
        expect(store.removeElement).not.toHaveBeenCalledWith('item2')
        expect(store.removeElement).not.toHaveBeenCalledWith('item3')
        expect(store.removeElement).not.toHaveBeenCalledWith('item4')
        expect(store.removeElement).not.toHaveBeenCalledWith('freeport')
      })

      it('should remove selected non-freeport, non-IC items', () => {
        expect(store.removeElement).toHaveBeenCalledWith('item1')
      })

      it('should remove all selected freeports', () => {
        expect(store.removeFreeport).toHaveBeenCalledWith('freeport')
      })
    })

    it('should not change the state if nothing is selected', () => {
      store.selectedItemIds = []
      store.deleteSelection()

      expect(store.commitState).not.toHaveBeenCalled()
      expect(store.setSelectionState).not.toHaveBeenCalled()
      expect(store.disconnect).not.toHaveBeenCalled()
      expect(store.removeFreeport).not.toHaveBeenCalled()
      expect(store.removeElement).not.toHaveBeenCalled()
    })
  })

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
          const item2 = createItem('item2', 'Lightbulb', { portIds: ['port2'] })

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

  describe('setItemPortPositions', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    describe('when the item does not exist', () => {
      it('should not compute any new port positions', () => {
        jest.spyOn(rotation, 'getRotatedPortPosition')

        store.setItemPortPositions('item1')

        expect(rotation.getRotatedPortPosition).not.toHaveBeenCalled()
      })
    })

    describe('when no ports are present', () => {
      it('should not compute any new port positions', () => {
        const item1 = createItem('item1', ItemType.LogicGate)

        jest.spyOn(rotation, 'getRotatedPortPosition')

        store.$patch({
          items: { item1 }
        })
        store.setItemPortPositions(item1.id)

        expect(rotation.getRotatedPortPosition).not.toHaveBeenCalled()
      })
    })

    describe('when ports are present', () => {
      const item1 = createItem('item1', ItemType.LogicGate, {
        portIds: ['leftPort', 'topPort', 'rightPort', 'bottomPort']
      })
      const leftPort = createPort('leftPort', 'item1', PortType.Output, { orientation: 0 })
      const topPort = createPort('topPort', 'item1', PortType.Output, { orientation: 1 })
      const rightPort = createPort('rightPort', 'item1', PortType.Output, { orientation: 2 })
      const bottomPort = createPort('bottomPort', 'item1', PortType.Output, { orientation: 3 })

      beforeEach(() => {
        store.$patch({
          ports: { leftPort, topPort, rightPort, bottomPort },
          items: { item1 }
        })
        store.setItemPortPositions(item1.id)
      })

      it('should set the new positions of left ports', () => {
        expect(store.ports[leftPort.id].position).toEqual(
          rotation.getRotatedPortPosition(leftPort, [leftPort], item1, 0)
        )
      })

      it('should set the new positions of right ports', () => {
        expect(store.ports[rightPort.id].position).toEqual(
          rotation.getRotatedPortPosition(rightPort, [rightPort], item1, 0)
        )
      })

      it('should set the new positions of top ports', () => {
        expect(store.ports[topPort.id].position).toEqual(
          rotation.getRotatedPortPosition(topPort, [topPort], item1, 0)
        )
      })

      it('should set the new positions of bottom ports', () => {
        expect(store.ports[bottomPort.id].position).toEqual(
          rotation.getRotatedPortPosition(bottomPort, [bottomPort], item1, 0)
        )
      })
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

  describe('moveSelectionPosition', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'setSelectionPosition',
        'commitState'
      ])
    })

    describe('when an item is selected', () => {
      const position: Point = { x: 7, y: 49 }
      const delta: Point = { x: 7, y: 49 }
      const item1 = createItem('item1', ItemType.LogicGate, { position, isSelected: true })

      beforeEach(() => {
        store.$patch({
          items: { item1 },
          selectedItemIds: ['item1', 'item2']
        })
        store.moveSelectionPosition(delta)
      })

      it('should commit the current state', () => {
        expect(store.commitState).toHaveBeenNthCalledWith(1)
      })

      it('should move the first selected item according to the delta provided', () => {
        expect(store.setSelectionPosition).toHaveBeenCalledWith({
          id: 'item1',
          position: {
            x: item1.position.x + delta.x,
            y: item1.position.y + delta.y
          }
        })
      })
    })

    describe('when nothing is selected', () => {
      it('should not dispatch anything', () => {
        store.moveSelectionPosition({ x: 7, y: 49 })

        expect(store.commitState).not.toHaveBeenCalled()
        expect(store.setSelectionPosition).not.toHaveBeenCalled()
      })
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
    const item2 = createItem('item2', ItemType.Freeport, { groupId: 'group1', isSelected: true })
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

    it('should move only the freeport if it is the reference item', () => {
      const newPosition: Point = {
        x: 10,
        y: 22
      }

      store.$patch({
        selectedItemIds: ['item1', 'item2']
      })
      store.setSelectionPosition({
        id: 'item2',
        position: newPosition
      })

      expect(store.setItemPosition).toHaveBeenCalledTimes(1)
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item2',
        position: {
          x: item2.position.x + newPosition.x,
          y: item2.position.y + newPosition.y
        }
      })
    })

    it('should set the position of each item according to the delta moved', () => {
      store.$patch({
        selectedItemIds: ['item1', 'item2']
      })
      store.setSelectionPosition({
        id: 'item1',
        position
      })

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
  })

  describe('setItemBoundingBox', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should not compute a new bounding box if the item does not exist', () => {
      jest.spyOn(boundaries, 'getItemBoundingBox')

      store.setItemBoundingBox('item1')

      expect(boundaries.getItemBoundingBox).not.toHaveBeenCalled()
    })

    it('should set the bounding box according to the one computed', () => {
      const boundingBox: BoundingBox = {
        left: 12,
        top: 42,
        right: 100,
        bottom: 231
      }
      const item1 = createItem('item1', ItemType.LogicGate)

      jest
        .spyOn(boundaries, 'getItemBoundingBox')
        .mockReturnValue(boundingBox)

      store.$patch({
        items: { item1 }
      })
      store.setItemBoundingBox(item1.id)

      expect(store.items[item1.id].boundingBox).toEqual(boundingBox)
    })
  })

  describe('setGroupBoundingBox', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should not compute a new bounding box if the group does not exist', () => {
      jest.spyOn(boundaries, 'getGroupBoundingBox')

      store.setGroupBoundingBox('group1')

      expect(boundaries.getGroupBoundingBox).not.toHaveBeenCalled()
    })

    it('should set the bounding box according to the one computed', () => {
      const boundingBox: BoundingBox = {
        left: 12,
        top: 42,
        right: 100,
        bottom: 231
      }
      const item1 = createItem('item1', ItemType.LogicGate)
      const group1 = createGroup('group1', ['item1'])

      store.$patch({
        items: { item1 },
        groups: { group1 }
      })

      jest
        .spyOn(boundaries, 'getGroupBoundingBox')
        .mockReturnValue(boundingBox)

      store.setGroupBoundingBox(group1.id)

      expect(store.groups[group1.id].boundingBox).toEqual(boundingBox)
    })
  })

  describe('group', () => {
    const store = createDocumentStore('document')()

    let groupId: string

    beforeEach(() => {
      const item1 = createItem('item1', ItemType.LogicGate, { isSelected: true, zIndex: 1 })
      const item2 = createItem('item2', ItemType.LogicGate, { groupId: 'group1', isSelected: true, zIndex: 2, portIds: ['port3', 'port4'] })
      const item3 = createItem('item3', ItemType.LogicGate, { isSelected: false, zIndex: 3 })
      const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true, zIndex: 4 })
      const connection2 = createConnection('connection2', 'port3', 'port4', { groupId: 'group1', isSelected: true, zIndex: 5 })
      const connection3 = createConnection('connection3', 'port5', 'port6', { isSelected: false, zIndex: 6 })

      stubAll(store, [
        'commitState',
        'setZIndex',
        'destroyGroup',
        'setGroupBoundingBox'
      ])

      store.$reset()
      store.$patch({
        items: { item1, item2 , item3 },
        connections: { connection1, connection2, connection3 }
      })
      store.group()

      groupId = Object.keys(store.groups)[0]
    })

    it('should destroy the groups of any selected items for which they are a member of', () => {
      expect(store.destroyGroup).toHaveBeenCalledWith('group1')
    })

    it('should set the zIndex of the selected items to the highest one among them', () => {
      expect(store.setZIndex).toHaveBeenCalledWith(5)
    })

    it('should only group items and connections that are selected and whose ports are entirely belonging to items in the group', () => {
      expect(store.groups[groupId]).toEqual(expect.objectContaining({
        id: groupId,
        itemIds: ['item1', 'item2'],
        connectionIds: ['connection2'],
        isSelected: true
      }))
    })

    it('should set the bounding box of the new group', () => {
      expect(store.setGroupBoundingBox).toHaveBeenCalledWith(groupId)
    })

    it('should set all groupIds of all items specified in the group to its ID', () => {
      expect(store.items.item1.groupId).toEqual(groupId)
      expect(store.items.item2.groupId).toEqual(groupId)
    })
  })

  describe('ungroup', () => {
    const store = createDocumentStore('document')()
    const group1 = createGroup('group1', [], { isSelected: true })
    const group2 = createGroup('group2', [], { isSelected: false })

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'destroyGroup'
      ])

      store.$reset()
      store.$patch({
        groups: { group1, group2 }
      })
      store.ungroup()
    })

    it('should commit the undo-able state', () => {
      expect(store.commitState).toHaveBeenCalled()
    })

    it('should destroy a selected group', () => {
      expect(store.destroyGroup).toHaveBeenCalledWith('group1')
    })

    it('should not destroy groups that are not selected', () => {
      expect(store.destroyGroup).not.toHaveBeenCalledWith('group2')
    })
  })

  describe('deselectAll', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })
      const item2 = createItem('item2', ItemType.Buffer, { isSelected: true })
      const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true })
      const connection2 = createConnection('connection2', 'port3', 'port4', { isSelected: true })

      stubAll(store, [
        'clearStatelessInfo'
      ])

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 }
      })
      store.deselectAll()
    })

    it('should clear all stateless info', () => {
      store.deselectAll()

      expect(store.clearStatelessInfo).toHaveBeenCalled()
    })

    it('should set isSelected to false for all connections', () => {
      expect(store.connections.connection1.isSelected).toBe(false)
      expect(store.connections.connection2.isSelected).toBe(false)
    })

    it('should set isSelected to false for all items', () => {
      expect(store.items.item2.isSelected).toBe(false)
      expect(store.items.item2.isSelected).toBe(false)
    })

    it('should empty the lists of selected connection and item ids', () => {
      expect(store.selectedItemIds).toHaveLength(0)
      expect(store.selectedConnectionIds).toHaveLength(0)
    })
  })

  describe('selectAll', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })
      const item2 = createItem('item2', ItemType.Buffer, { isSelected: true })
      const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true })
      const connection2 = createConnection('connection2', 'port3', 'port4', { isSelected: true })

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 }
      })
      store.selectAll()
    })

    it('should set isSelected to true for all connections', () => {
      expect(store.connections.connection1.isSelected).toBe(true)
      expect(store.connections.connection2.isSelected).toBe(true)
    })

    it('should set isSelected to true for all items', () => {
      expect(store.items.item2.isSelected).toBe(true)
      expect(store.items.item2.isSelected).toBe(true)
    })

    it('should populate selectedItemIds to have exactly all item ids selected', () => {
      expect(store.selectedItemIds).toHaveLength(2)
      expect(store.selectedItemIds).toContain('item1')
      expect(store.selectedItemIds).toContain('item2')
    })

    it('should populate selectedConnectionIds to have exactly all connection ids selected', () => {
      expect(store.selectedConnectionIds).toHaveLength(2)
      expect(store.selectedConnectionIds).toContain('connection1')
      expect(store.selectedConnectionIds).toContain('connection2')
    })
  })

  describe('createSelection', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'SET_SELECTION_STATE',
        'selectItemConnections'
      ])
    })

    it('should not select anything if the selection is not a valid two-dimensional rectangle', () => {
      store.createSelection({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
      })

      expect(store.SET_SELECTION_STATE).not.toHaveBeenCalled()
      expect(store.selectItemConnections).not.toHaveBeenCalled()
    })

    describe('when the selection is a two-dimensional rectangle', () => {
      const port = createPort('port', 'item1', PortType.Input)
      const item1 = createItem('item1', ItemType.LogicGate)
      const item2 = createItem('item2', ItemType.LogicGate)
      const connection1 = createConnection('connection1', 'port', 'port')
      const connection2 = createConnection('connection2', 'port', 'port')

      beforeEach(() => {
        jest
          .spyOn(boundaries, 'hasIntersection')
          .mockReturnValueOnce(true) // item1 is in rect
          .mockReturnValueOnce(false) // item2 is not in rect
        jest
          .spyOn(boundaries, 'isLineIntersectingRectangle')
          .mockReturnValueOnce(true) // connection1 is in rect
          .mockReturnValueOnce(false) // connection2 is not in rect

        store.$patch({
          items: { item1, item2 },
          connections: { connection1, connection2 },
          ports: { port }
        })

        store.createSelection({
          left: 10,
          top: 10,
          right: 100,
          bottom: 100
        })
      })

      it('should select all items that lie within the selection boundary', () => {
        expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({
          id: item1.id,
          isSelected: true
        })
      })

      it('should select all connections that lie within the selection boundary', () => {
        expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({
          id: connection1.id,
          isSelected: true
        })
      })

      it('should not select a connection that lies outside the selection boundary', () => {
        expect(store.SET_SELECTION_STATE).not.toHaveBeenCalledWith({
          id: connection2.id,
          isSelected: true
        })
      })

      it('should select the connections of all items that lie within the selection boundary', () => {
        expect(store.selectItemConnections).toHaveBeenCalledWith([item1.id])
      })
    })
  })

  describe('selectItemConnections', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.LogicGate, { portIds: ['port1'] })
    const item2 = createItem('item2', ItemType.LogicGate, { portIds: ['port2'] })
    const item3 = createItem('item3', ItemType.LogicGate, { portIds: ['port3'] })
    const item4 = createItem('item4', ItemType.LogicGate, { portIds: ['port4'] })
    const port1 = createPort('port1', 'item1', PortType.Output)
    const port2 = createPort('port2', 'item2', PortType.Input)
    const port3 = createPort('port3', 'item3', PortType.Output)
    const port4 = createPort('port4', 'item4', PortType.Input)
    const connection1 = createConnection('connection1', 'port1', 'port2')
    const connection2 = createConnection('connection2', 'port3', 'port4')
    const connection3 = createConnection('connection2', 'port3', 'port4')

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2, item3, item4 },
        ports: { port1, port2, port3, port4 },
        connections: { connection1, connection2, connection3 }
      })

      stubAll(store, [
        'SET_SELECTION_STATE'
      ])
    })

    it('should select a connection whose source and target are both attached to selected items', () => {
      store.selectItemConnections([item4.id, item3.id])

      expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({ id: connection3.id, isSelected: true })
    })

    it('should not select a connection if only its source is among the item ports selected', () => {
      store.selectItemConnections([item1.id])

      expect(store.SET_SELECTION_STATE).not.toHaveBeenCalledWith({ id: connection1.id, isSelected: true })
    })

    it('should not select a connection if only its targt is among the item ports selected', () => {
      store.selectItemConnections([item2.id])

      expect(store.SET_SELECTION_STATE).not.toHaveBeenCalledWith({ id: connection1.id, isSelected: true })
    })

    it('should not select a connection where neither its target nor its source is an item in the given list', () => {
      store.selectItemConnections([item1.id, item2.id])

      expect(store.SET_SELECTION_STATE).not.toHaveBeenCalledWith({ id: connection2.id, isSelected: true })
    })
  })

  describe('setSelectionState', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'SET_SELECTION_STATE'
      ])
    })

    describe('when the element is part of a larger group', () => {
      const groupId = 'group1'
      const item1 = createItem('item1', ItemType.LogicGate, { groupId })
      const item2 = createItem('item2', ItemType.LogicGate, { groupId })
      const connection1 = createConnection('connection1', 'port1', 'port2', { groupId })
      const connection2 = createConnection('connection2', 'port3', 'port4')
      const group1 = createGroup('group1', ['item1', 'item2'], { connectionIds: ['connection1'] })

      beforeEach(() => {
        store.$patch({
          items: { item1, item2 },
          connections: { connection1, connection2 },
          groups: { group1 }
        })

        store.setSelectionState({ id: 'item1', value: true })
      })

      it('should select all the elements and connections within that group', () => {
        store.setSelectionState({ id: 'item1', value: true })
        expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({ id: 'item1', isSelected: true })
        expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({ id: 'item2', isSelected: true })
        expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({ id: 'connection1', isSelected: true })
      })

      it('should not select elements outside the group for which the item is a member of', () => {
        expect(store.SET_SELECTION_STATE).not.toHaveBeenCalledWith({
          id: 'connection2',
          isSelected: expect.any(Boolean)
        })
      })

      it('should select the group', () => {
        expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({ id: 'group1', isSelected: true })
      })
    })

    it('should select only the element when the element is not a member of any group', () => {
      const item1 = createItem('item1', ItemType.LogicGate)

      store.$patch({
        items: { item1 }
      })
      store.setSelectionState({ id: 'item1', value: true })

      expect(store.SET_SELECTION_STATE).toHaveBeenCalledWith({ id: 'item1', isSelected: true })
    })

    it('should not commit any mutations if the value does not differ from the one provided', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { isSelected: true })

      store.$patch({
        items: { item1 }
      })
      store.setSelectionState({ id: 'item1', value: true })

      expect(store.SET_SELECTION_STATE).not.toHaveBeenCalled()
    })

    it('should not change the selection of an element that does not exist', () => {
      store.setSelectionState({ id: 'item1', value: true })

      expect(store.SET_SELECTION_STATE).not.toHaveBeenCalled()
    })
  })

  describe('setConnectionPreview', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'connect',
        'unsetConnectionPreview'
      ])
    })

    describe('when a port is active and a port ID is passed', () => {
      const activePortId = 'active-port-id'
      const portId = 'port-id'

      describe('when the port is an output port', () => {
        const port = createPort(activePortId, 'element-id', PortType.Output)

        it('should establish a preview connection if the port is not currently connected', () => {
          store.$patch({
            activePortId,
            ports: {
              [activePortId]: port
            }
          })
          store.setConnectionPreview(portId)

          expect(store.connect).toHaveBeenCalledTimes(1)
          expect(store.connect).toHaveBeenCalledWith({
            source: activePortId,
            target: portId,
            id: expect.any(String)
          })
        })
      })

      describe('when the port is an input port', () => {
        const port = createPort(activePortId, 'element-id', PortType.Input)

        it('should establish a preview connection if the port is not currently connected', () => {
          store.$patch({
            activePortId,
            ports: {
              [activePortId]: port
            }
          })
          store.setConnectionPreview(portId)

          expect(store.connect).toHaveBeenCalledTimes(1)
          expect(store.connect).toHaveBeenCalledWith({
            source: portId,
            target: activePortId,
            id: expect.any(String)
          })
        })
      })
    })

    it('should not connect or disconnect anything if the port ID is not defined', () => {
      store.setConnectionPreview(null)

      expect(store.connect).not.toHaveBeenCalled()
    })

    it('should not connect or disconnect anything if there is no active port', () => {
      store.setConnectionPreview('port-id')

      expect(store.connect).not.toHaveBeenCalled()
    })
  })

  describe('unsetConnectionPreview ', () => {
    const store = createDocumentStore('document')()

    describe('when there is a connection preview set', () => {
      const connection = createConnection('connection', 'source-id', 'target-id')

      beforeEach(() => {
        stubAll(store, [
          'disconnect'
        ])

        store.$patch({
          connectionPreviewId: connection.id,
          connections: { connection }
        })
        store.unsetConnectionPreview()
      })

      it('should disconnect the active connection', () => {
        expect(store.disconnect).toHaveBeenCalledTimes(1)
        expect(store.disconnect).toHaveBeenCalledWith(connection)
      })

      it('should clear the connection preview id', () => {
        expect(store.connectionPreviewId).toBeNull()
      })
    })

    it('should clear the connection preview id', () => {
      store.unsetConnectionPreview()

      expect(store.connectionPreviewId).toBeNull()
    })
  })

  describe('commitPreviewedConnection ', () => {
    const store = createDocumentStore('document')()

    describe('when there is a connection preview set', () => {
      const source = createPort('source-id', 'item-id', PortType.Output)
      const target = createPort('target-id', 'item-id', PortType.Input)
      const connection = createConnection('connection', 'source-id', 'target-id')

      beforeEach(() => {
        stubAll(store, [
          'connect',
          'disconnect',
          'commitState'
        ])

        store.$patch({
          connectionPreviewId: connection.id,
          connections: { connection },
          ports: {
            [source.id]: source,
            [target.id]: target
          }
        })
        store.commitPreviewedConnection()
      })

      it('should commit the cached state', () => {
        expect(store.commitState).toHaveBeenCalledTimes(1)
      })

      it('should disconnect the existing connection', () => {
        expect(store.disconnect).toHaveBeenCalledTimes(1)
        expect(store.disconnect).toHaveBeenCalledWith({ source: source.id, target: target.id })
      })

      it('should re-connect the connection without a preview ID set', () => {
        expect(store.connect).toHaveBeenCalledTimes(1)
        expect(store.connect).toHaveBeenCalledWith({ source: source.id, target: target.id })
      })

      it('should clear the connection preview id', () => {
        expect(store.connectionPreviewId).toBeNull()
      })
    })

    it('should clear the connection preview id', () => {
      store.commitPreviewedConnection()

      expect(store.connectionPreviewId).toBeNull()
    })
  })

  describe('cycleConnectionPreviews', () => {
    const store = createDocumentStore('document')()
    const portId = 'port1'
    const connectablePortIds = ['port1', 'port2', 'port3']

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: {
          port1: createPort('port1', 'element-id', PortType.Input),
          port2: createPort('port2', 'element-id', PortType.Input),
          port3: createPort('port3', 'element-id', PortType.Input)
        }
      })

      jest
        .spyOn(window.api, 'beep')
        .mockImplementation(jest.fn())

      stubAll(store, [
        'setConnectionPreview',
        'unsetConnectionPreview',
        'setConnectablePortIds',
        'setActivePortId',
        'cacheState'
      ])
    })

    it('should set the active port ID to the one provided if not already active', () => {
      store.$patch({
        activePortId: 'port2',
        cachedState: createSerializedState()
      })
      store.cycleConnectionPreviews(portId)

      expect(store.setActivePortId).toHaveBeenCalledTimes(1)
      expect(store.setActivePortId).toHaveBeenCalledWith(portId)
    })

    it('should start cycling at index 0 if an index is not defined', () => {
      store.$patch({
        activePortId: portId,
        connectablePortIds,
        selectedPortIndex: -1
      })
      store.cycleConnectionPreviews(portId)

      expect(store.setConnectionPreview).toHaveBeenCalledTimes(1)
      expect(store.setConnectionPreview).toHaveBeenCalledWith(connectablePortIds[0])
    })

    it('should clear the connection preview if all possible connections are cycled through already', () => {
      store.$patch({
        activePortId: portId,
        connectablePortIds,
        selectedPortIndex: 2
      })
      store.cycleConnectionPreviews(portId)

      expect(store.unsetConnectionPreview).toHaveBeenCalledTimes(1)
    })

    it('should not cache the state if a state is already cached', () => {
      store.$patch({
        activePortId: portId,
        cachedState: createSerializedState()
      })
      store.cycleConnectionPreviews(portId)

      expect(store.cacheState).not.toHaveBeenCalled()
    })
  })

  describe('setActivePortId', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, ['setConnectablePortIds'])
    })

    describe('when the port ID differs from the currently-active one', () => {
      beforeEach(() => {
        store.$patch({
          activePortId: 'active-port-id'
        })
      })

      it('should define the connectable port IDs if the port ID is defined', () => {
        const portId = 'port-id'

        store.setActivePortId(portId)

        expect(store.setConnectablePortIds).toHaveBeenCalledWith({ portId })
        expect(store.activePortId).toEqual(portId)
        expect(store.selectedPortIndex).toEqual(-1)
      })

      it('should clear the connectable port IDs if the port ID provided is not defined', () => {
        store.setActivePortId(null)

        expect(store.connectablePortIds).toEqual([])
        expect(store.activePortId).toEqual(null)
        expect(store.selectedPortIndex).toEqual(-1)
      })
    })

    it('should not make any changes if the given port ID is already active', () => {
      const activePortId = 'active-port-id'

      store.$patch({ activePortId })
      store.setActivePortId(activePortId)

      expect(store.setConnectablePortIds).not.toHaveBeenCalled()
      expect(store.connectablePortIds).toEqual([])
      expect(store.activePortId).toEqual(activePortId)
      expect(store.selectedPortIndex).toEqual(-1)
    })
  })

  describe('rotate', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'setItemPosition',
        'setItemBoundingBox',
        'setItemPortPositions',
        'setGroupBoundingBox'
      ])

      store.$reset()
    })

    describe('rotating a group', () => {
      const item1 = createItem('item1', ItemType.LogicGate, {
        groupId: 'group1',
        portIds: ['port1'],
        isSelected: true
      })
      const item2 = createItem('item2', ItemType.LogicGate, {
        groupId: 'group1',
        portIds: ['port2'],
        isSelected: true
      })
      const port1 = createPort('port1', 'item1', PortType.Input)
      const port2 = createPort('port2', 'item2', PortType.Input)
      const group1 = createGroup('group1', ['item1', 'item2'])
      const group2 = createGroup('group2', [])

      beforeEach(() => {
        store.$patch({
          items: { item1, item2 },
          ports: { port1, port2 },
          groups: { group1, group2 }
        })
        store.rotate(1)
      })

      it('should commit the undo-able state', () => {
        expect(store.commitState).toHaveBeenCalled()
      })

      it('should set the rotations of the selected items', () => {
        expect(store.items.item1.rotation).toEqual(2)
        expect(store.items.item2.rotation).toEqual(2)
      })

      it('should set the rotations of the ports of all selected items', () => {
        expect(store.ports.port1.rotation).toEqual(3)
        expect(store.ports.port2.rotation).toEqual(3)
      })

      it('should update the items\' bounding boxes', () => {
        expect(store.setItemBoundingBox).toHaveBeenCalledWith('item1')
        expect(store.setItemBoundingBox).toHaveBeenCalledWith('item2')
      })

      it('should update the items\' port positions', () => {
        expect(store.setItemPortPositions).toHaveBeenCalledWith('item1')
        expect(store.setItemPortPositions).toHaveBeenCalledWith('item2')
      })

      it('should update the group\'s bounding box for each group rotated', () => {
        expect(store.setGroupBoundingBox).toHaveBeenCalledWith('group1')
      })

      it('should not mutate a group which has none of its elements selected', () => {
        expect(store.setGroupBoundingBox).not.toHaveBeenCalledWith('group2')
      })
    })

    describe('rotating an individual item', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { isSelected: true })

      beforeEach(() => {
        store.$patch({
          items: { item1 }
        })

        store.rotate(1)
      })

      it('should commit the undo-able state', () => {
        expect(store.commitState).toHaveBeenCalled()
      })

      it('should set the rotation of the item', () => {
        expect(store.items.item1.rotation).toEqual(2)
      })

      it('should update the item\'s bounding box', () => {
        expect(store.setItemBoundingBox).toHaveBeenCalledWith('item1')
      })

      it('should update the item\'s port position', () => {
        expect(store.setItemPortPositions).toHaveBeenCalledWith('item1')
      })
    })
  })

  describe('removeFreeport', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'disconnect',
        'connect',
        'removeElement'
      ])
    })

    describe('when a connection is connected at both the target and the source', () => {
      beforeEach(() => {
        store.$patch({
          connections: {
            'connection1': createConnection('connection1', 'port1', 'port2'),
            'connection2': createConnection('connection2', 'port3', 'port4')
          },
          ports: {
            'port1': createPort('port1', 'item1', PortType.Output),
            'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
            'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true }),
            'port4': createPort('port4', 'item2', PortType.Input)
          },
          items: {
            'item1': createItem('item1', ItemType.InputNode, { portIds: ['port1'] }),
            'item2': createItem('item2', ItemType.OutputNode, { portIds: ['port4'] }),
            'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'] })
          }
        })
        store.removeFreeport('freeport')
      })

      it('should disconnect the freeport from its source', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port1', target: 'port2' })
      })

      it('should disconnect the freeport from its target', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port3', target: 'port4' })
      })

      it('should connect the freeport\'s original source to its original target', () => {
        expect(store.connect).toHaveBeenCalledWith({ source: 'port1', target: 'port4' })
      })

      it('should remove the item from the document', () => {
        expect(store.removeElement).toHaveBeenCalledWith('freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        store.$patch({
          connections: {
            'connection1': createConnection('connection1', 'port1', 'port2')
          },
          ports: {
            'port1': createPort('port1', 'item1', PortType.Output),
            'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
            'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true })
          },
          items: {
            'item1': createItem('item1', ItemType.InputNode, { portIds: ['port1'] }),
            'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'] })
          }
        })
        store.removeFreeport('freeport')
      })

      it('should only disconnect the freeport from its source', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port1', target: 'port2' })
      })

      it('should remove the item from the document', () => {
        expect(store.removeElement).toHaveBeenCalledWith('freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        store.$patch({
          connections: {
            'connection2': createConnection('connection2', 'port3', 'port4')
          },
          ports: {
            'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
            'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true }),
            'port4': createPort('port4', 'item2', PortType.Input)
          },
          items: {
            'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'] }),
            'item2': createItem('item2', ItemType.OutputNode, { portIds: ['port4'] })
          }
        })
        store.removeFreeport('freeport')
      })

      it('should only disconnect the freeport from its target', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port3', target: 'port4' })
      })

      it('should remove the item from the document', () => {
        expect(store.removeElement).toHaveBeenCalledWith('freeport')
      })
    })
  })

  describe('createFreeport', () => {
    const store = createDocumentStore('document')()

    const itemId = 'freeport'
    const sourceId = 'source-port'
    const targetId = 'target-port'
    const connectionChainId = 'connection-chain'
    const inputPortId = 'freeport-input-port'
    const outputPortId = 'freeport-output-port'
    const position: Point = { x: 0, y: 0 }

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'addFreeportItem',
        'disconnect',
        'connect',
        'commitState',
        'setItemBoundingBox',
        'setSelectionState',
        'deselectAll'
      ])
    })

    it('should not create a new freeport if an item having the same ID already exists', () => {
      store.$patch({
        items: {
          [itemId]: createItem(itemId, ItemType.Freeport)
        }
      })
      store.createFreeport({
        itemId,
        outputPortId,
        inputPortId,
        position
      })

      expect(store.connect).not.toHaveBeenCalled()
      expect(store.disconnect).not.toHaveBeenCalled()
      expect(store.addFreeportItem).not.toHaveBeenCalled()
    })

    describe('when this freeport is a joint between two connection segments', () => {
      const data = {
        itemId,
        sourceId,
        targetId,
        inputPortId,
        outputPortId,
        connectionChainId,
        position
      }

      beforeEach(() => {
        store.createFreeport(data)
      })

      it('should commit the current state to be undo-able', () => {
        expect(store.commitState).toHaveBeenCalled()
      })

      it('should deselect all items', () => {
        expect(store.deselectAll).toHaveBeenCalled()
      })

      it('should create the new freeport', () => {
        expect(store.addFreeportItem).toHaveBeenCalledWith({
          ...data,
          position: {
            x: 0,
            y: 0
          }
        })
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(itemId)
        expect(store.activeFreeportId).toEqual(itemId)
      })

      it('should split the connection between the given source and target connection', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: sourceId, target: targetId })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(store.connect).toHaveBeenCalledWith({ source: sourceId, target: inputPortId, connectionChainId })
        expect(store.connect).toHaveBeenCalledWith({ source: outputPortId, target: targetId, connectionChainId })
      })
    })

    describe('when this freeport is a port being dragged from an output port', () => {
      const data = {
        itemId,
        sourceId,
        inputPortId,
        outputPortId: '',
        connectionChainId,
        position
      }

      beforeEach(() => {
        store.createFreeport(data)
      })

      it('should not commit the current state to be undo-able', () => {
        expect(store.commitState).not.toHaveBeenCalled()
      })

      it('should deselect all items', () => {
        expect(store.deselectAll).toHaveBeenCalled()
      })

      it('should create the new freeport', () => {
        expect(store.addFreeportItem).toHaveBeenCalledWith(data)
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(itemId)
        expect(store.activeFreeportId).toEqual(itemId)
      })

      it('should not disconnect any connections', () => {
        expect(store.disconnect).not.toHaveBeenCalledWith(expect.any(Object))
      })

      it('should not reconnect the target port to anything', () => {
        expect(store.connect).not.toHaveBeenCalledWith({
          source: expect.any(String),
          target: targetId,
          connectionChainId
        })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(store.connect).toHaveBeenCalledWith({ source: sourceId, target: inputPortId, connectionChainId })
      })
    })

    describe('when this freeport is a port being dragged from an input port', () => {
      const data = {
        itemId,
        targetId,
        inputPortId,
        outputPortId,
        connectionChainId,
        position
      }

      beforeEach(() => {
        store.createFreeport(data)
      })

      it('should not commit the current state to be undo-able', () => {
        expect(store.commitState).not.toHaveBeenCalled()
      })

      it('should deselect all items', () => {
        expect(store.deselectAll).toHaveBeenCalled()
      })

      it('should create the new freeport', () => {
        expect(store.addFreeportItem).toHaveBeenCalledWith(data)
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(itemId)
        expect(store.activeFreeportId).toEqual(itemId)
      })

      it('should not disconnect any connections', () => {
        expect(store.disconnect).not.toHaveBeenCalledWith(expect.any(Object))
      })

      it('should not reconnect the source port to anything', () => {
        expect(store.connect).not.toHaveBeenCalledWith({
          source: sourceId,
          target: expect.any(String),
          connectionChainId
        })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(store.connect).toHaveBeenCalledWith({ source: outputPortId, target: targetId, connectionChainId })
      })
    })
  })

  describe('connectFreeport', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'removeElement',
        'disconnect',
        'connect',
        'commitState'
      ])

      store.$reset()
    })

    describe('when there is a port in the neighborhood', () => {
      const sourceId = 'source-id'
      const targetId = 'target-id'
      const portId = 'port-id'
      const newPortId = 'new-port-id'

      const patch = (connectablePortIds: string[] = []) => store.$patch({
        ports: {
          [sourceId]: createPort(sourceId, '2', PortType.Input),
          [targetId]: createPort(sourceId, '2', PortType.Output),
          [newPortId]: createPort(newPortId, '2', PortType.Output),
          [portId]: createPort(portId, '1', PortType.Input)
        },
        connectablePortIds
      })

      beforeEach(() => {
        store.$reset()

        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(true)
      })

      it('should not connect the port to itself or to one that is not in the predefined set of connectable ports', () => {
        patch()

        store.connectFreeport({ sourceId, portId })

        expect(store.connect).not.toHaveBeenCalled()
      })

      describe('when a connection is being made from an output port (acting as a source)', () => {
        beforeEach(() => {
          patch([newPortId])

          store.connectFreeport({ sourceId, portId })
        })

        it('should disconnect the temporary dragged port from the source', () => {
          expect(store.disconnect).toHaveBeenCalledWith({
            source: sourceId,
            target: portId
          })
        })

        it('should connect the the source to the discovered target', () => {
          expect(store.connect).toHaveBeenCalledWith({
            source: sourceId,
            target: newPortId
          })
        })
      })

      describe('when a connection is being made from an input port (acting as a target) to a receiving output port', () => {
        beforeEach(() => {
          patch([newPortId])

          store.connectFreeport({ targetId, portId })
        })

        it('should disconnect the temporary dragged port from the old target', () => {
          expect(store.disconnect).toHaveBeenCalledWith({
            source: portId,
            target: targetId
          })
        })

        it('should connect the the source to the new discovered source', () => {
          expect(store.connect).toHaveBeenCalledWith({
            source: newPortId,
            target: targetId
          })
        })
      })

      describe('when any connectable port is discovered', () => {
        it('should clear the list of connectable port IDs', () => {
          patch([newPortId])

          store.connectFreeport({ sourceId, portId })

          expect(store.connectablePortIds).toEqual([])
        })
      })

      describe('when an item owns the given port', () => {
        const itemId = 'item-id'
        const otherItemId = 'other-item-id'

        beforeEach(() => {
          patch([newPortId])

          store.$patch({
            items: {
              [itemId]: createItem(itemId, ItemType.Freeport, { portIds: [portId] }),
              [otherItemId]: createItem(otherItemId, ItemType.Freeport, { portIds: [sourceId, targetId] })
            }
          })
          store.connectFreeport({ sourceId, portId })
        })

        it('should remove the item', () => {
          expect(store.removeElement).toHaveBeenCalledWith(itemId)
        })

        it('should not remove any other items', () => {
          expect(store.removeElement).not.toHaveBeenCalledWith(otherItemId)
        })
      })
    })
  })

  describe('setConnectablePortIds', () => {
    const store = createDocumentStore('document')()
    const patch = (sourcePort: Port, targetPort: Port, state = {}) => store.$patch({
      ports: {
        [sourcePort.id]: sourcePort,
        [targetPort.id]: targetPort
      },
      ...state
    })

    beforeEach(() => store.$reset())

    it('should include an input port if the source port is an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual(['target-port'])
    })

    it('should not include an output port if the source port is also an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Output)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not include a target port that is already connected', () => {
      const connectedTargetPort = createPort('conn-port', '0', PortType.Output)
      const connectedSourcePort = createPort('conn-port-2', '3', PortType.Input)
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)
      const connection1 = createConnection('conn1', connectedSourcePort.id, connectedTargetPort.id)
      const connection2 = createConnection('conn2', connectedSourcePort.id, targetPort.id)

      patch(sourcePort, targetPort, {
        connections: {
          [connection2.id]: connection2,
          [connection1.id]: connection1
        },
        ports: {
          [sourcePort.id]: sourcePort,
          [targetPort.id]: targetPort,
          [connectedSourcePort.id]: connectedSourcePort,
          [connectedTargetPort.id]: connectedTargetPort
        }
      })

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not include a target port that is already connected', () => {
      const connectedTargetPort = createPort('conn-port', '0', PortType.Output)
      const connectedSourcePort = createPort('conn-port-2', '3', PortType.Input)
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)
      const connection1 = createConnection('conn1', connectedSourcePort.id, connectedTargetPort.id)
      const connection2 = createConnection('conn2', connectedSourcePort.id, targetPort.id)

      patch(sourcePort, targetPort, {
        connections: {
          [connection2.id]: connection2,
          [connection1.id]: connection1
        },
        ports: {
          [sourcePort.id]: sourcePort,
          [targetPort.id]: targetPort,
          [connectedSourcePort.id]: connectedSourcePort,
          [connectedTargetPort.id]: connectedTargetPort
        }
      })

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not include a target port that is a freeport', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input, { isFreeport: true })

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not allow a source port to connect to anything if it is a freeport', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output, { isFreeport: true })
      const targetPort = createPort('target-port', '2', PortType.Input)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should include an output port if the source port is an input port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Input)
      const targetPort = createPort('target-port', '2', PortType.Output)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual(['target-port'])
    })

    it('should not include an output port if the source port is also an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Output)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })
  })

  describe('setOscilloscopeVisibility', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      jest
        .spyOn(store.simulation, 'unmonitorPort')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store.simulation, 'monitorPort')
        .mockImplementation(jest.fn())
    })

    describe('when the item is being added to the oscilloscope', () => {
      const item1 = createItem('item1', ItemType.OutputNode, { portIds: ['item1port1', 'item2port2'] })
      const item2 = createItem('item2', ItemType.InputNode, { portIds: ['item2port1', 'item2port2'] })
      const item1port1 = createPort('item1port1', 'item1', PortType.Input)
      const item1port2 = createPort('item1port2', 'item1', PortType.Output)
      const item2port1 = createPort('item2port1', 'item2', PortType.Input)
      const item2port2 = createPort('item2port2', 'item2', PortType.Output)

      beforeEach(() => {
        store.$patch({
          items: { item1, item2 },
          ports: { item1port1, item1port2, item2port1, item2port2 }
        })
      })

      it('should monitor its input ports when the item is an output node', () => {
        store.setOscilloscopeVisibility({ id: 'item1', value: true })

        expect(store.simulation.monitorPort).toHaveBeenCalledTimes(1)
        expect(store.simulation.monitorPort).toHaveBeenCalledWith('item1port1', item1port1.value)
      })

      it('should monitor its output ports when the item is an input node', () => {
        store.setOscilloscopeVisibility({ id: 'item2', value: true })

        expect(store.simulation.monitorPort).toHaveBeenCalledTimes(1)
        expect(store.simulation.monitorPort).toHaveBeenCalledWith('item2port2', item2port2.value)
      })
    })

    describe('when the item is being removed from the oscilloscope', () => {
      const item1 = createItem('item1', ItemType.OutputNode, { portIds: ['port1', 'port2'] })
      const port1 = createPort('port1', 'item1', PortType.Input)
      const port2 = createPort('port2', 'item1', PortType.Output)

      it('should unmonitor for each port in the given item', () => {
        store.$patch({
          items: { item1 },
          ports: { port1, port2 }
        })

        store.setOscilloscopeVisibility({ id: 'item1', value: false })

        expect(store.simulation.unmonitorPort).toHaveBeenCalledTimes(2)
        expect(store.simulation.unmonitorPort).toHaveBeenCalledWith('port1')
        expect(store.simulation.unmonitorPort).toHaveBeenCalledWith('port2')
      })
    })
  })

  describe('setInputCount', () => {
    const store = createDocumentStore('document')()

    const id = 'item1'
    const port1 = createPort('port1', id, PortType.Input)
    const port2 = createPort('port2', id, PortType.Output)
    const port3 = createPort('port3', id, PortType.Input)
    const item1 = createItem(id, ItemType.InputNode, {
      portIds: [port1.id, port2.id, port3.id],
      properties: {
        inputCount: {
          value: 2,
          type: 'number',
          label: 'Input Count'
        }
      }
    })

    beforeEach(() => {
      stubAll(store, [
        'addPort',
        'removePort'
      ])

      store.$reset()
      store.$patch({
        items: { item1 },
        ports: { port1, port2, port3 }
      })
    })

    describe('when the input count is increased', () => {
      beforeEach(() => {
        store.setInputCount({ id, count: 4 })
      })

      it('should add the difference number of input ports', () => {
        const portId = Object.keys(store.ports).slice(-1)[0]

        expect(store.addPort).toHaveBeenCalledWith(id, {
          id: expect.any(String),
          name: expect.any(String),
          connectedPortIds: [],
          type: PortType.Input,
          elementId: id,
          virtualElementId: id,
          orientation: Direction.Left,
          isFreeport: false,
          position: {
            x: 0,
            y: 0
          },
          rotation: 0,
          value: 0
        })
        expect(store.items.item1.portIds).toContain(portId)
      })
    })

    describe.skip('when the input count is decreased', () => {
      beforeEach(() => {
        store.setInputCount({ id, count: 1 })
      })

      it('should remove the difference number of input ports at the end of the list', () => {
        expect(store.removePort).toHaveBeenCalledWith(port3.id)
      })

      it('should set the item port positions', () => {
        expect(store.setItemPortPositions).toHaveBeenCalledWith(id)
      })
    })
  })

  describe('setProperties', () => {
    const store = createDocumentStore('document')()

    const id = 'item1'
    const createProperties = (): PropertySet => ({
      inputCount: {
        value: 2,
        label: 'Input Count',
        type: 'number'
      },
      showInOscilloscope: {
        value: true,
        label: 'Show in oscilloscope',
        type: 'boolean'
      },
      name: {
        value: 'Some name',
        label: 'Name',
        type: 'text'
      }
    })

    beforeEach(() => {
      stubAll(store, [
        'setOscilloscopeVisibility',
        'setInputCount'
      ])

      store.$reset()
    })

    it('should not change anything if no properties have changed', () => {
      const properties = createProperties()
      const item1 = createItem(id, ItemType.LogicGate, { properties })

      store.$patch({
        items: { item1 }
      })
      store.setProperties({ id, properties })

      expect(store.setOscilloscopeVisibility).not.toHaveBeenCalled()
      expect(store.setInputCount).not.toHaveBeenCalled()
    })

    it('should dispatch setOscilloscopeVisibility when the showInOscilloscope has changed', () => {
      const item1 = createItem(id, ItemType.LogicGate, { properties: createProperties() })
      const properties = createProperties()
      properties.showInOscilloscope.value = false

      store.$patch({
        items: { item1 }
      })
      store.setProperties({ id, properties })

      expect(store.setOscilloscopeVisibility).toHaveBeenCalledWith({ id, value: false })
    })

    it('should dispatch setInputCount when the inputCount has changed', () => {
      const item1 = createItem(id, ItemType.LogicGate, { properties: createProperties() })
      const properties = createProperties()

      properties.inputCount.value = 3

      store.$patch({
        items: { item1 }
      })
      store.setProperties({ id, properties })

      expect(store.setInputCount).toHaveBeenCalledWith({ id, count: 3 })
    })

    it('should set the new item property value', () => {
      const propertyName = 'name'
      const value = 'New value'
      const item1 = createItem(id, ItemType.LogicGate, { properties: createProperties() })
      const properties = createProperties()
      properties[propertyName].value = value

      store.$patch({
        items: { item1 }
      })
      store.setProperties({ id, properties })

      expect(store.items[id].properties[propertyName].value).toEqual(value)
    })
  })

  describe('cacheState', () => {
    it('should set the cached state to a stringified object containing the connections, items, ports, and groups', () => {
      const store = createDocumentStore('document')()

      store.cacheState()

      expect(store.cachedState).toEqual(JSON.stringify({
        connections: store.connections,
        items: store.items,
        ports: store.ports,
        groups: store.groups
      }))
    })
  })

  describe.skip('commitCachedState', () => {
    describe('when there is a state cached', () => {
      const store = createDocumentStore('document')()
      const cachedState = createSerializedState()

      beforeEach(() => {
        store.$reset()
        store.$patch({
          cachedState,
          redoStack: [
            createSerializedState(),
            createSerializedState()
          ]
        })

        store.commitCachedState()
      })

      it('should push the cached state into the undo stack', () => {
        expect(store.undoStack[store.undoStack.length - 1]).toEqual(cachedState)
      })

      it('should clear the current cached state', () => {
        expect(store.cachedState).toBeNull()
      })

      it('should clear the redo stack', () => {
        expect(store.redoStack).toHaveLength(0)
      })
    })

    it('should not mutate the undo stack if there is no cached state', () => {
      const store = createDocumentStore('document')()

      store.$patch({ cachedState: null })
      store.commitCachedState()

      expect(store.undoStack).toHaveLength(0)
    })
  })

  describe('applyState', () => {
    const store = createDocumentStore('document')()

    const addedItem1 = createItem('addedItem1', ItemType.InputNode)
    const addedItem2 = createItem('addedItem2', ItemType.InputNode)
    const addedIc = createItem('addedIc', ItemType.IntegratedCircuit, { integratedCircuit: {} })
    const addedPort1 = createPort('addedPort1', 'addedItem1', PortType.Output)
    const addedPort2 = createPort('addedPort2', 'addedItem2', PortType.Input)
    const addedConnection = createConnection('addedConnection', 'addedPort1', 'addedPort2')

    const removedItem1 = createItem('removedItem1', ItemType.InputNode)
    const removedItem2 = createItem('removedItem2', ItemType.InputNode)
    const removedPort1 = createPort('removedPort1', 'removedItem1', PortType.Output)
    const removedPort2 = createPort('removedPort2', 'removedItem2', PortType.Input)
    const removedConnection = createConnection('removedConnection', 'removedPort1', 'removedPort2')

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { removedItem1, removedItem2 },
        ports: { removedPort1, removedPort2 },
        connections: { removedConnection }
      })

      stubAll(store, [
        'addNewItem',
        'removeElement',
        'connect',
        'disconnect'
      ])

      store.applyState(JSON.stringify({
        items: { addedItem1, addedItem2, addedIc },
        ports: { addedPort1, addedPort2 },
        connections: { addedConnection }
      }))
    })

    it('should add the items that are not present in the old state but are new one', () => {
      expect(store.items).not.toHaveProperty('removedItem1')
      expect(store.items).not.toHaveProperty('removedItem2')
    })

    it('should remove the items from the old state that are not present in the new one', () => {
      expect(store.items).toHaveProperty('addedItem1')
      expect(store.items).toHaveProperty('addedItem2')
      expect(store.items.addedItem1).toEqual(addedItem1)
      expect(store.items.addedItem2).toEqual(addedItem2)
      expect(store.items.addedIc).toEqual(addedIc)
    })

    it('should commit removeElement for each item that will be lost between states', () => {
      expect(store.removeElement).toHaveBeenCalledWith('removedItem1')
      expect(store.removeElement).toHaveBeenCalledWith('removedItem2')
    })

    it('should commit disconnect for each connection that will be lost between states', () => {
      expect(store.disconnect).toHaveBeenCalledWith(store.connections.removedConnection)
    })

    it('should commit connect for each connection that will be gained between states', () => {
      expect(store.connect).toHaveBeenCalledWith(addedConnection)
    })
  })

  describe('removePort', () => {
    const store = createDocumentStore('document')()

    const item1 = createItem('item1', ItemType.InputNode, { portIds: ['startPort'] })
    const item2 = createItem('item2', ItemType.OutputNode, { portIds: ['endPort'] })
    const freeportItem = createItem('freeportItem', ItemType.Freeport, { portIds: ['inputPort', 'outputPort'] })
    const inputPort = createPort('inputPort', 'freeportItem', PortType.Input, { isFreeport: true })
    const outputPort = createPort('outputPort', 'freeportItem', PortType.Output, { isFreeport: true })
    const startPort = createPort('startPort', 'item1', PortType.Output)
    const endPort = createPort('endPort', 'item2', PortType.Input)
    const connectionPart1 = createConnection('connectionPart1', 'startPort', 'inputPort', { connectionChainId: 'connectionPart1' })
    const connectionPart2 = createConnection('connectionPart2', 'outputPort', 'endPort', { connectionChainId: 'connectionPart1' })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2, freeportItem },
        ports: { inputPort, outputPort, startPort, endPort },
        connections: { connectionPart1, connectionPart2 }
      })

      jest
        .spyOn(store.simulation, 'removeConnection')
        .mockImplementation(jest.fn())
    })

    function assertRemovePort (description: string, portId: string) {
      describe(description, () => {
        beforeEach(() => {
          store.removePort(portId)
        })

        it('should remove the connections from the entire connection chain', () => {
          expect(store.connections).not.toHaveProperty('connectionPart1')
          expect(store.connections).not.toHaveProperty('connectionPart2')
        })

        it('should remove the connections from the circuit', () => {
          expect(store.simulation.removeConnection).toHaveBeenCalledTimes(2)
          expect(store.simulation.removeConnection).toHaveBeenCalledWith('startPort', 'inputPort')
          expect(store.simulation.removeConnection).toHaveBeenCalledWith('outputPort', 'endPort')
        })

        it('should remove the freeport item in the connection chain', () => {
          expect(store.items).not.toHaveProperty('freeportItem')
        })

        it('should remove all ports associated with the connection chain', () => {
          expect(store.ports).not.toHaveProperty('inputPort')
          expect(store.ports).not.toHaveProperty('outputPort')
        })
      })
    }

    assertRemovePort('when the start port of the chain is being removed', 'startPort')
    assertRemovePort('when the end port of the chain is being removed', 'endPort')
    assertRemovePort('when the input port of the freeport item in the chain is being removed', 'inputPort')
    assertRemovePort('when the output port of the freeport item in the chain is being removed', 'outputPort')
  })

  describe('setPortValues', () => {
    const store = createDocumentStore('document')()

    let port1: Port
    let port2: Port
    let port3: Port

    beforeEach(() => {
      store.$reset()

      port1 = createPort('port1', 'item1', PortType.Input, { value: 0 })
      port2 = createPort('port2', 'item1', PortType.Output, { value: -1 })
      port3 = createPort('port3', 'item1', PortType.Output, { value: -1 })
    })

    it('should set the values of each port changed in the value map', () => {
      store.$patch({
        ports: { port1, port2, port3 }
      })
      store.setPortValues({ port1: 1, port2: 1 })

      expect(store.ports.port1.value).toEqual(1)
      expect(store.ports.port2.value).toEqual(1)
    })

    it('should not change the value of a port not present in the value map', () => {
      store.$patch({
        ports: { port1, port2, port3 }
      })
      store.setPortValues({ port1: 1, port2: 1 })

      expect(store.ports.port3.value).toEqual(-1)
    })

    it('should not break if a port that does not exist is present in the map', () => {
      store.$patch({
        ports: { port1, port2, port3 }
      })

      expect.assertions(3)

      store.setPortValues({ someNonExistingPort: 1 })

      expect(store.ports.port1.value).toEqual(0)
      expect(store.ports.port2.value).toEqual(-1)
      expect(store.ports.port3.value).toEqual(-1)
    })
  })

  describe('setPortValue', () => {
    it('should set given the port value for the given node id', () => {
      const store = createDocumentStore('document')()
      const id = 'node1'
      const value = 1

      jest
        .spyOn(store.simulation, 'setPortValue')
        .mockImplementation(jest.fn())

      store.setPortValue({ id, value })

      expect(store.simulation.setPortValue).toHaveBeenCalledTimes(1)
      expect(store.simulation.setPortValue).toHaveBeenCalledWith(id, value)
    })
  })

  describe('addNewItem', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      jest
        .spyOn(store.simulation, 'addNode')
        .mockImplementation(jest.fn())
    })

    describe('when the item is not an integrated circuit', () => {
      const item = createItem('item', ItemType.InputNode)
      const port = createPort('port', 'item1', PortType.Output)

      beforeEach(() => {
        store.addNewItem({ item, ports: [port] })
      })

      it('should add the ports to the state', () => {
        expect(store.ports).toHaveProperty('port')
        expect(store.ports.port).toEqual(port)
      })

      it('should add the item to the state', () => {
        expect(store.items).toHaveProperty('item')
        expect(store.items.item).toEqual(item)
      })

      it('should add the item as a node to the circuit', () => {
        expect(store.simulation.addNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.addNode).toHaveBeenCalledWith(item, store.ports)
      })
    })

    describe('when the item is an integrated circuit', () => {
      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const icItem = createItem('icItem', ItemType.IntegratedCircuit, {
        integratedCircuit: {
          items: {},
          portIds: ['port1'],
          ports: { port1, port2 },
          connections: {}
        },
        portIds: ['port2']
      })

      beforeEach(() => {
        store.addNewItem({ item: icItem, ports: [] })
      })

      xit('should add each port that is visible to the user to the state', () => {
        expect(store.ports).not.toHaveProperty('port1')
        expect(store.ports).toHaveProperty('port2')
        expect(store.ports.port2).toEqual(port2)
      })

      it('should add the integrated circuit item to the state', () => {
        expect(store.items).toHaveProperty('icItem')
        expect(store.items.icItem).toEqual(icItem)
      })

      it('should install the integrated circuit onto the active circuit', () => {
        expect(store.simulation.addNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.addNode).toHaveBeenCalledWith(icItem, store.ports)
      })
    })
  })

  describe('removeElement', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => store.$reset())

    describe('when the item is an integrated circuit', () => {
      const node1 = createItem('node1', ItemType.CircuitNode, { portIds: ['node1port'] })
      const node2 = createItem('node2', ItemType.CircuitNode, { portIds: ['node2port'] })
      const icItem = createItem('icItem', ItemType.IntegratedCircuit, {
        integratedCircuit: {
          items: { node1, node2 }
        },
        portIds: ['port1', 'port2']
      })
      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const port3 = createPort('port3', 'otherItem', PortType.Output)

      beforeEach(() => {
        store.$patch({
          items: { icItem },
          ports: { port1, port2, port3 }
        })

        jest
          .spyOn(store.simulation, 'removeNode')
          .mockImplementation(jest.fn())
        jest
          .spyOn(store, 'removePort')
          .mockImplementation(jest.fn())

        store.removeElement('icItem')
      })

      it('should remove each port associated to the IC', () => {
        expect(store.removePort).toHaveBeenCalledTimes(2)
        expect(store.removePort).toHaveBeenCalledWith('port1')
        expect(store.removePort).toHaveBeenCalledWith('port2')
      })

      it('should remove each embedded IC item from the circuit', () => {
        expect(store.simulation.removeNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.removeNode).toHaveBeenCalledWith(icItem)
      })

      it('should not remove ports that are not associated to the IC', () => {
        expect(store.removePort).not.toHaveBeenCalledWith('port3')
      })

      it('should remove the IC item', () => {
        expect(store.items).not.toHaveProperty('icItem')
      })
    })

    describe('when the item is regular, non-IC element', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { portIds: ['port1', 'port2'] })
      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const port3 = createPort('port3', 'otherItem', PortType.Output)

      beforeEach(() => {
        store.$patch({
          items: { item1 },
          ports: { port1, port2, port3 }
        })

        jest
          .spyOn(store.simulation, 'removeNode')
          .mockImplementation(jest.fn())
        jest
          .spyOn(store, 'removePort')
          .mockImplementation(jest.fn())


        store.removeElement('item1')
      })


      it('should remove each port associated to the IC', () => {
        expect(store.removePort).toHaveBeenCalledTimes(2)
        expect(store.removePort).toHaveBeenCalledWith('port1')
        expect(store.removePort).toHaveBeenCalledWith('port2')
      })

      it('should remove the node from the circuit', () => {
        expect(store.simulation.removeNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.removeNode).toHaveBeenCalledWith(item1)
      })

      it('should not remove ports that are not associated to the item', () => {
        expect(store.ports).toHaveProperty('port3')
        expect(store.ports.port3).toEqual(port3)
      })

      it('should remove the item', () => {
        expect(store.items).not.toHaveProperty('item1')
      })
    })
  })

  describe('SET_SELECTION_STATE', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => store.$reset())

    it('should select the item', () => {
      const item1 = createItem('item1', ItemType.Buffer)

      store.$patch({
        items: { item1 }
      })

      store.SET_SELECTION_STATE({ id: 'item1', isSelected: true })

      expect(store.items.item1.isSelected).toBe(true)
    })

    describe('when the item is a connection', () => {
      const item1 = createItem('item1', ItemType.InputNode, { portIds: ['startPort'] })
      const item2 = createItem('item2', ItemType.OutputNode, { portIds: ['endPort'] })
      const freeportItem = createItem('freeportItem', ItemType.Freeport, { portIds: ['inputPort', 'outputPort'] })
      const inputPort = createPort('inputPort', 'freeportItem', PortType.Input, { isFreeport: true })
      const outputPort = createPort('outputPort', 'freeportItem', PortType.Output, { isFreeport: true })
      const startPort = createPort('startPort', 'item1', PortType.Output)
      const endPort = createPort('endPort', 'item2', PortType.Input)
      const connectionPart1 = createConnection('connectionPart1', 'startPort', 'inputPort', { connectionChainId: 'connectionPart1' })
      const connectionPart2 = createConnection('connectionPart2', 'outputPort', 'endPort', { connectionChainId: 'connectionPart1' })
      const connectionOther = createConnection('connectionOther', 'outputPort', 'endPort', { connectionChainId: 'connectionOther' })

      beforeEach(() => {
        store.$patch({
          items: { item1, item2, freeportItem },
          ports: { inputPort, outputPort, startPort, endPort },
          connections: { connectionPart1, connectionPart2, connectionOther }
        })

        store.SET_SELECTION_STATE({ id: 'connectionPart1', isSelected: true })
      })

      it('should select all connections that are part of the connection chain', () => {
        expect(store.connections.connectionPart1.isSelected).toBe(true)
        expect(store.connections.connectionPart2.isSelected).toBe(true)
      })

      it('should populate the selected connection IDs to the list of cached selected connection IDs', () => {
        expect(store.selectedConnectionIds).toHaveLength(2)
        expect(store.selectedConnectionIds).toContain('connectionPart1')
        expect(store.selectedConnectionIds).toContain('connectionPart2')
      })

      it('should not include a connection outside the connection chain', () => {
        expect(store.connections.connectionOther.isSelected).toBe(false)
      })

      it('should select all freeports associated to the chain', () => {
        expect(store.items.freeportItem.isSelected).toBe(true)
      })

      it('should populate the selected freeport ID to the list of cached selected item IDs', () => {
        expect(store.selectedItemIds).toHaveLength(1)
        expect(store.selectedItemIds).toContain('freeportItem')
      })
    })

    it('should remove the selection from the cached list if it is already selected', () => {
      const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })

      store.$patch({
        items: { item1 },
        selectedItemIds: ['item1']
      })

      store.SET_SELECTION_STATE({ id: 'item1', isSelected: false })

      expect(store.items.item1.isSelected).toBe(false)
      expect(store.selectedItemIds).toHaveLength(0)
    })

    it('should select nothing if the element does not exist', () => {
      const item1 = createItem('item1', ItemType.Buffer)

      store.$patch({
        items: { item1 }
      })

      store.SET_SELECTION_STATE({ id: 'someNonExistingElement', isSelected: true })

      expect(store.items.item1.isSelected).not.toBe(true)
    })
  })

  describe('incrementZIndex', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode, { zIndex: 1 }),
          item2: createItem('item2', ItemType.InputNode, { zIndex: 3 }),
          item3: createItem('item3', ItemType.InputNode, { zIndex: 5 }),
          item4: createItem('item4', ItemType.InputNode, { zIndex: 7 })
        },
        connections: {
          connection1: createConnection('connection1', 'port1', 'port2', { zIndex: 2 }),
          connection2: createConnection('connection2', 'port3', 'port4', { zIndex: 4 }),
          connection3: createConnection('connection3', 'port6', 'port5', { zIndex: 6 }),
          connection4: createConnection('connection4', 'port7', 'port8', { zIndex: 8 })
        }
      })
    })

    it('should decrement selected items backward', () => {
      store.items.item2.isSelected = true
      store.items.item4.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(-1)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item2.zIndex).toEqual(2)
      expect(store.items.item3.zIndex).toEqual(7)
      expect(store.items.item4.zIndex).toEqual(6)
      expect(store.connections.connection1.zIndex).toEqual(3)
      expect(store.connections.connection2.zIndex).toEqual(4)
      expect(store.connections.connection3.zIndex).toEqual(5)
      expect(store.connections.connection4.zIndex).toEqual(8)
    })

    it('should increment selected items forward', () => {
      store.items.item2.isSelected = true
      store.items.item4.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(1)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item2.zIndex).toEqual(4)
      expect(store.items.item3.zIndex).toEqual(5)
      expect(store.items.item4.zIndex).toEqual(8)
      expect(store.connections.connection1.zIndex).toEqual(2)
      expect(store.connections.connection2.zIndex).toEqual(3)
      expect(store.connections.connection3.zIndex).toEqual(7)
      expect(store.connections.connection4.zIndex).toEqual(6)
    })

    it('should not increment a selected item\'s z-index if it collides with the next item\'s movement', () => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode, {
            zIndex: 1,
            isSelected: true
          }),
          item2: createItem('item2', ItemType.InputNode, {
            zIndex: 2,
            isSelected: true
          })
        }
      })
      store.incrementZIndex(1)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item2.zIndex).toEqual(2)
    })

    it('should not allow sibling items to collide while moving forward', () => {
      store.items.item3.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(1)

      expect(store.items.item3.zIndex).toEqual(6)
      expect(store.connections.connection3.zIndex).toEqual(7)
    })

    it('should not allow sibling items to collide while moving backward', () => {
      store.items.item3.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(-1)

      expect(store.items.item3.zIndex).toEqual(4)
      expect(store.connections.connection3.zIndex).toEqual(5)
    })

    it('should not allow an item already at the back to decrement further', () => {
      store.items.item1.isSelected = true

      store.incrementZIndex(-1)

      expect(store.items.item1.zIndex).toEqual(1)
    })

    it('should not allow an item already at the front to increment further', () => {
      store.connections.connection4.isSelected = true

      store.incrementZIndex(1)

      expect(store.connections.connection4.zIndex).toEqual(8)
    })
  })

  describe('setZIndex', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode, { zIndex: 1 }),
          item2: createItem('item2', ItemType.InputNode, { zIndex: 3 }),
          item3: createItem('item3', ItemType.InputNode, { zIndex: 5 }),
          item4: createItem('item4', ItemType.InputNode, { zIndex: 7 })
        },
        connections: {
          connection1: createConnection('connection1', 'port1', 'port2', { zIndex: 2 }),
          connection2: createConnection('connection2', 'port3', 'port4', { zIndex: 4 }),
          connection3: createConnection('connection3', 'port6', 'port5', { zIndex: 6 }),
          connection4: createConnection('connection4', 'port7', 'port8', { zIndex: 8 })
        }
      })
    })

    it('should move all items together to the given zIndex value', () => {
      store.items.item2.isSelected = true
      store.items.item4.isSelected = true
      store.connections.connection3.isSelected = true

      store.setZIndex(8)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item3.zIndex).toEqual(4)
      expect(store.connections.connection1.zIndex).toEqual(2)
      expect(store.connections.connection2.zIndex).toEqual(3)
      expect(store.connections.connection4.zIndex).toEqual(5)
      expect(store.items.item2.zIndex).toEqual(6)
      expect(store.connections.connection3.zIndex).toEqual(7)
      expect(store.items.item4.zIndex).toEqual(8)
    })
  })

  describe('connect', () => {
    const store = createDocumentStore('document')()
    const source = 'source-id'
    const target = 'target-id'

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: {
          [source]: createPort(source, 'item1', PortType.Output),
          [target]: createPort(target, 'item2', PortType.Input)
        }
      })

      jest
        .spyOn(store.simulation, 'addConnection')
        .mockImplementation(jest.fn())
    })

    it('should not add any new connections if the source is not specified', () => {
      store.connect({ target })

      const connections = Object.keys(store.connections)

      expect(connections).toHaveLength(0)
      expect(store.simulation.addConnection).not.toHaveBeenCalled()
    })

    it('should not add any new connections if the target is not specified', () => {
      store.connect({ source })

      const connections = Object.keys(store.connections)

      expect(connections).toHaveLength(0)
      expect(store.simulation.addConnection).not.toHaveBeenCalled()
    })

    it('should add the connection to the state if both the source and target are specified', () => {
      store.connect({ source, target })

      const connections = Object.keys(store.connections)

      expect(connections).toHaveLength(1)
      expect(store.connections[connections[0]]).toEqual({
        id: expect.any(String),
        source,
        target,
        connectionChainId: expect.any(String),
        groupId: null,
        zIndex: 2,
        isSelected: false
      })
      expect(store.simulation.addConnection).toHaveBeenCalledTimes(1)
      expect(store.simulation.addConnection).toHaveBeenCalledWith(source, target)
    })

    // it('should set the connection preview ID if isPreview is true', () => {
    //   store.connect({ source, target, isPreview: true })

    //   expect(store.connectionPreviewId).toEqual(Object.keys(store.connections)[0])
    // })

    it('should add the connected port ids to each port\'s list', () => {
      store.connect({ source, target })

      expect(store.ports[source].connectedPortIds).toEqual([target])
      expect(store.ports[target].connectedPortIds).toEqual([source])
    })

    it('should add the connection to the specified chain if its ID is provided', () => {
      const connectionChainId = 'connection-chain-id'

      store.connect({ source, target, connectionChainId })

      const connections = Object.keys(store.connections)

      expect(connections).toHaveLength(1)
      expect(store.connections[connections[0]]).toEqual({
        id: expect.any(String),
        source,
        target,
        connectionChainId,
        groupId: null,
        zIndex: 2,
        isSelected: false
      })
    })
  })

  describe('disconnect', () => {
    const store = createDocumentStore('document')()
    const source = 'source-id'
    const target = 'target-id'
    const connection = createConnection('connection', source, target)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        connections: { connection },
        ports: {
          [source]: createPort(source, 'item1', PortType.Output, { connectedPortIds: [target] }),
          [target]: createPort(target, 'item2', PortType.Input, { connectedPortIds: [source] })
        }
      })

      jest
        .spyOn(store.simulation, 'removeConnection')
        .mockImplementation(jest.fn())
    })

    it('should not remove the connection if the source was not found', () => {
      store.disconnect({ source: 'invalid-id', target })

      expect(store.connections).toHaveProperty('connection')
      expect(store.connections.connection).toEqual(connection)
    })

    it('should not remove the connection if the target was not found', () => {
      store.disconnect({ source, target: 'invalid-id' })

      expect(store.connections).toHaveProperty('connection')
      expect(store.connections.connection).toEqual(connection)
    })

    it('should remove the references to opposite connected ports whose connections were removed', () => {
      store.disconnect({ source, target })

      expect(store.ports[source].connectedPortIds).toHaveLength(0)
      expect(store.ports[target].connectedPortIds).toHaveLength(0)
    })

    it('should remove the connection from the state and the circuit', () => {
      store.disconnect({ source, target })

      expect(store.connections).not.toHaveProperty('connection')
      expect(store.simulation.removeConnection).toHaveBeenCalledTimes(1)
      expect(store.simulation.removeConnection).toHaveBeenCalledWith(source, target)
    })
  })

  describe('destroyGroup', () => {
    const store = createDocumentStore('document')()

    let item1: Item
    let item2: Item
    let connection1: Connection
    let connection2: Connection
    let group: Group

    const groupId = 'group-id'

    beforeEach(() => {
      item1 = createItem('item1', ItemType.Buffer, { groupId })
      item2 = createItem('item2', ItemType.Buffer, { groupId })
      connection1 = createConnection('connection1', 'port1', 'port2', { groupId })
      connection2 = createConnection('connection2', 'port3', 'port4', { groupId })
      group = createGroup(groupId, ['item1', 'item2'], {
        connectionIds: ['connection1', 'connection2']
      })

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 },
        groups: { [groupId]: group }
      })

      store.destroyGroup(groupId)
    })

    it('should remove the group from the state', () => {
      expect(store.groups).not.toHaveProperty(groupId)
    })

    it('should set all groupIds of all items specified in the group to null', () => {
      expect(store.items.item1.groupId).toBeNull()
      expect(store.items.item2.groupId).toBeNull()
    })

    it('should set all groupIds of all connections specified in the group to null', () => {
      expect(store.connections.connection1.groupId).toBeNull()
      expect(store.connections.connection2.groupId).toBeNull()
    })
  })

  describe('addFreeportItem', () => {
    const store = createDocumentStore('document')()

    const itemId = 'item-id'
    const inputPortId = 'input-port-id'
    const outputPortId = 'output-port-id'
    const value = 1
    const position: Point = {
      x: 10,
      y: 25
    }

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          [itemId]: createItem(itemId, ItemType.InputNode)
        }
      })

      jest
        .spyOn(store.simulation, 'addNode')
        .mockImplementation(jest.fn())
    })

    it('should add an input port if its ID is defined', () => {
      store.addFreeportItem({ itemId, inputPortId, position })

      expect(store.ports).toHaveProperty(inputPortId)
      expect(store.ports[inputPortId]).toEqual({
        id: inputPortId,
        type: PortType.Input,
        connectedPortIds: [],
        name: '',
        elementId: itemId,
        orientation: Direction.Right,
        isFreeport: true,
        position: { x: 0, y: 0 },
        rotation: 0,
        value: 0
      })
    })

    it('should add an output port if its ID is defined', () => {
      store.addFreeportItem({ itemId, outputPortId, position })

      expect(store.ports).toHaveProperty(outputPortId)
      expect(store.ports[outputPortId]).toEqual({
        id: outputPortId,
        connectedPortIds: [],
        name: '',
        type: PortType.Output,
        elementId: itemId,
        orientation: Direction.Left,
        isFreeport: true,
        position: { x: 0, y: 0 },
        rotation: 0,
        value: 0
      })
    })

    it('should add a new freeport item with the provided port IDs', () => {
      store.addFreeportItem({ itemId, inputPortId, outputPortId, position, value })

      expect(store.items).toHaveProperty(itemId)
      expect(store.items[itemId]).toEqual({
        id: itemId,
        name: 'Freeport 1',
        type: ItemType.Freeport,
        subtype: ItemSubtype.None,
        portIds: [inputPortId, outputPortId],
        position,
        rotation: 0,
        boundingBox: {
          left: position.x,
          top: position.y,
          right: position.x,
          bottom: position.y
        },
        properties: {},
        isSelected: false,
        groupId: null,
        zIndex: 2,
        width: 1,
        height: 1
      })
    })

    it('should add the freeport to the circuit with its evaluation forced', () => {
      store.addFreeportItem({ itemId, inputPortId, outputPortId, position, value })

      expect(store.simulation.addNode).toHaveBeenCalledTimes(1)
      expect(store.simulation.addNode).toHaveBeenCalledWith(store.items[itemId], store.ports, true)
    })
  })
})
