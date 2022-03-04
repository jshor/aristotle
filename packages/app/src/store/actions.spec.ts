import { ActionContext, ActionHandler } from 'vuex'
import actions from './actions'
import DocumentState from './DocumentState'
import CircuitService from '../services/CircuitService'
import Direction from '../types/enums/Direction'
import PortType from '../types/enums/PortType'
import boundaries from '@/layout/boundaries'

// jest.mock('../services/CircuitService', () => {

// })

const createState = (): DocumentState => ({
  cachedState: null,
  activeFreeportId: null,
  undoStack: [],
  redoStack: [],
  snapBoundaries: [],
  connectablePortIds: [],
  circuit: new CircuitService([], [], {}),
  waves: {
    waves: {},
    secondsElapsed: 0,
    secondsOffset: 0
  },
  zoomLevel: 1,
  groups: {},
  items: {},
  connections: {},
  ports: {}
})

const createContext = ({
  state = createState(),
  commit = jest.fn(),
  dispatch = jest.fn(),
  getters = {}
}: {
  state?: DocumentState,
  commit?: jest.Mock,
  dispatch?: jest.Mock,
  getters?: any
}): ActionContext<DocumentState, DocumentState> => ({
  state,
  commit,
  dispatch,
  getters,
  rootGetters: {},
  rootState: createState()
})

const invokeAction = (actionName: string, context: ActionContext<DocumentState, DocumentState>, payload?: any) => {
  return (actions[actionName] as Function)(context, payload)
}

describe('actions', () => {
  const commit = jest.fn()
  const dispatch = jest.fn()

  const createConnection = (id: string, source: string, target: string, payload: any = {}): Connection => ({
    id,
    source,
    target,
    connectionChainId: '1',
    groupId: null,
    isSelected: false,
    zIndex: 1,
    ...payload
  })

  const createPort = (id: string, elementId: string, type: PortType, payload: any = {}): Port => ({
    id,
    elementId,
    position: {
      x: 0,
      y: 0
    },
    type,
    rotation: 0,
    orientation: 0,
    value: 0,
    isFreeport: false,
    ...payload
  })

  const createItem = (id: string, type: string, payload: any = {}): Item => ({
    id,
    type,
    portIds: [],
    groupId: null,
    rotation: 0,
    boundingBox: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    position: {
      x: 0,
      y: 0
    },
    zIndex: 0,
    width: 0,
    height: 0,
    ...payload
  })

  const createGroup = (id: string, itemIds: string[] = [], payload: any = {}): Group => ({
    id,
    itemIds,
    rotation: 0,
    boundingBox: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    position: {
      x: 0,
      y: 0
    },
    zIndex: 0,
    ...payload
  })

  beforeEach(() => jest.resetAllMocks())

  describe('setZoom', () => {
    it('should set the zoom to the given value', () => {
      invokeAction('setZoom', createContext({ commit }), 1)

      expect(commit).toHaveBeenCalledWith('SET_ZOOM', 1)
    })
  })

  describe('undo', () => {
    describe('when an available state exists in the undo stack', () => {
      const undoState = JSON.stringify(createState())

      beforeEach(() => {
        invokeAction('undo', createContext({
          state: {
            ...createState(),
            undoStack: [undoState]
          },
          commit
        }))
      })

      it('should first cache the current state', () => {
        expect(commit).toHaveBeenNthCalledWith(1, 'CACHE_STATE')
      })

      it('should then commit the state to the redo stack', () => {
        expect(commit).toHaveBeenNthCalledWith(2, 'COMMIT_TO_REDO')
      })

      it('should then apply the undo-able state on the top of the undo stack', () => {
        expect(commit).toHaveBeenNthCalledWith(3, 'APPLY_STATE', undoState)
      })

      it('should finally remove the redo-able state from the top of the redo stack', () => {
        expect(commit).toHaveBeenNthCalledWith(4, 'REMOVE_LAST_UNDO_STATE')
      })
    })

    it('should not commit anything to the store if the undo stack is empty', () => {
      invokeAction('undo', createContext({
        state: {
          ...createState(),
          undoStack: []
        },
        commit
      }))

      expect(commit).not.toHaveBeenCalled()
    })
  })

  describe('redo', () => {
    describe('when an available state exists in the undo stack', () => {
      const redoState = JSON.stringify(createState())

      beforeEach(() => {
        invokeAction('redo', createContext({
          state: {
            ...createState(),
            redoStack: [redoState]
          },
          commit
        }))
      })

      it('should first cache the current state', () => {
        expect(commit).toHaveBeenNthCalledWith(1, 'CACHE_STATE')
      })

      it('should then commit the state back to the undo stack', () => {
        expect(commit).toHaveBeenNthCalledWith(2, 'COMMIT_TO_UNDO')
      })

      it('should then apply the undo-able state on the top of the redo stack', () => {
        expect(commit).toHaveBeenNthCalledWith(3, 'APPLY_STATE', redoState)
      })

      it('should finally remove the redo-able state from the top of the redo stack', () => {
        expect(commit).toHaveBeenNthCalledWith(4, 'REMOVE_LAST_REDO_STATE')
      })
    })

    it('should not commit anything to the store if the redo stack is empty', () => {
      invokeAction('redo', createContext({
        state: {
          ...createState(),
          redoStack: []
        },
        commit
      }))

      expect(commit).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelection', () => {
    beforeEach(() => {
      const context = createContext({
        commit,
        dispatch,
        state: {
          ...createState(),
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
            'item1': createItem('item1', 'InputNode', { portIds: ['port1'], isSelected: true }),
            'item2': createItem('item2', 'OutputNode', { portIds: ['port4'] }),
            'freeport': createItem('freeport', 'Freeport', { portIds: ['port2', 'port3'], isSelected: true }),
            'item3': createItem('item3', 'InputNode', { portIds: ['port5'] }),
            'item4': createItem('item4', 'OutputNode', { portIds: ['port6'] }),
            'ic': createItem('ic', 'IntegratedCircuit', {
              portIds: ['icPort'],
              isSelected: true,
              integratedCircuit: {
                items: {
                  icNode: createItem('icNode', 'InputNode')
                }
              }
            })
          }
        }
      })

      invokeAction('deleteSelection', context)
    })

    it('should commit the current state to the undo stack', () => {
      expect(dispatch).toHaveBeenCalledWith('commitState')
    })

    it('should select all connections that are attached to selected non-freeport items', () => {
      expect(dispatch).toHaveBeenCalledWith('toggleSelectionState', { id: 'connection1', forcedValue: true })
      expect(dispatch).not.toHaveBeenCalledWith('toggleSelectionState', { id: 'connection3', forcedValue: true })
    })

    it('should not select connections attached to a freeport', () => {
      expect(dispatch).not.toHaveBeenCalledWith('toggleSelectionState', { id: 'connection2', forcedValue: true })
    })

    it('should not select a connection with an invalid source port reference', () => {
      expect(dispatch).not.toHaveBeenCalledWith('toggleSelectionState', { id: 'dragged_connection1', forcedValue: true })
      expect(dispatch).not.toHaveBeenCalledWith('toggleSelectionState', { id: 'dragged_connection2', forcedValue: true })
    })

    it('should disconnect selected connections', () => {
      expect(commit).toHaveBeenCalledWith('DISCONNECT', { source: 'port5', target: 'port6' })
    })

    it('should remove selected non-freeport items', () => {
      expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'item1')
      expect(commit).not.toHaveBeenCalledWith('REMOVE_ELEMENT', 'item2')
      expect(commit).not.toHaveBeenCalledWith('REMOVE_ELEMENT', 'item3')
      expect(commit).not.toHaveBeenCalledWith('REMOVE_ELEMENT', 'item4')
      expect(commit).not.toHaveBeenCalledWith('REMOVE_ELEMENT', 'freeport')
    })

    it('should remove the circuit node elements of each element within an selected integrated circuit', () => {
      expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'icNode')
      expect(commit).not.toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'ic')
    })

    it('should remove the circuit node element of selected non-freeport, non-IC items', () => {
      expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'item1')
    })

    it('should remove all selected freeports', () => {
      expect(dispatch).toHaveBeenCalledWith('removeFreeport', 'freeport')
    })
  })

  describe('setSnapBoundaries', () => {
    it('should not apply any snap boundaries for an item that does not exist', () => {
      const context = createContext({ commit })

      invokeAction('setSnapBoundaries', context, 'some-bogus-item-id')

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', [])
    })

    describe('when there are connectable ports defined', () => {
      it('should return boundaries for each port position', () => {
        const item1 = createItem('item1', 'Freeport')
        const port1 = createPort('port1', 'item1', PortType.Input, { position: { x: 10, y: 20 } })
        const port2 = createPort('port2', 'item2', PortType.Output, { position: { x: 8, y: 42 } })
        const context = createContext({
          commit,
          state: {
            ...createState(),
            ports: { port1, port2 },
            items: { item1 },
            connectablePortIds: ['port1', 'port2']
          }
        })

        invokeAction('setSnapBoundaries', context, item1.id)

        expect(commit).toHaveBeenCalledTimes(1)
        expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', [
          { left: 10, top: 20, right: 10, bottom: 20 },
          { left: 8, top: 42, right: 8, bottom: 42 }
        ])
      })
    })

    it('should not apply any snap boundaries for grouped items', () => {
      const item1 = createItem('item1', 'LogicGate', { groupId: 'group1' })
      const context = createContext({
        commit,
        state: {
          ...createState(),
          items: { item1 }
        }
      })

      invokeAction('setSnapBoundaries', context, item1.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', [])
    })

    describe('when the item is not part of any group', () => {
      describe('when the item is an actively-dragged freeport', () => {
        it('should clear all snap boundaries', () => {
          const itemPort = createPort('itemPort', 'item1', PortType.Output)
          const draggedPort = createPort('draggedPort', '', PortType.Input)
          const connection = createConnection('connection1', itemPort.id, draggedPort.id)
          const freeport = createItem('freeport', 'Freeport', { portIds: ['itemPort'] })

          invokeAction('setSnapBoundaries', createContext({
            commit,
            state: {
              ...createState(),
              items: { freeport },
              connections: { connection },
              ports: { itemPort, draggedPort },
              connectablePortIds: []
            }
          }), freeport.id)

          expect(commit).toHaveBeenCalledTimes(1)
          expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', [])
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

          const freeport = createItem('freeport', 'Freeport', { portIds: ['freeportPort1', 'freeportPort2'] })
          const item1 = createItem('item1', 'LogicGate', { portIds: ['port1'] })
          const item2 = createItem('item2', 'Lightbulb', { portIds: ['port2'] })

          jest
            .spyOn(boundaries, 'getLinearBoundaries')
            .mockReturnValueOnce(sourceValues)
            .mockReturnValueOnce(targetValues)

          invokeAction('setSnapBoundaries', createContext({
            commit,
            state: {
              ...createState(),
              items: { freeport, item1, item2 },
              connections: { connection1, connection2, connection3 },
              ports: { port1, port2, freeportPort1, freeportPort2 },
              connectablePortIds: []
            }
          }), freeport.id)
        })

        it('should apply the linear boundaries for the origin item source port', () => {
          expect(commit).toHaveBeenCalledTimes(1)
          expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', expect.arrayContaining(sourceValues))
        })

        it('should apply the linear boundaries for the destination item target port', () => {
          expect(commit).toHaveBeenCalledTimes(1)
          expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', expect.arrayContaining(targetValues))
        })

        it('should only include boundaries for the source and target ports', () => {
          expect(commit).toHaveBeenCalledTimes(1)
          expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', [ ...sourceValues, ...targetValues ])
        })
      })

      describe('when the item is not a freeport', () => {
        const bbox1: BoundingBox = { left: 1, top: 2, right: 3, bottom: 4 }
        const bbox2: BoundingBox = { left: 5, top: 6, right: 7, bottom: 8 }
        const bbox3: BoundingBox = { left: 9, top: 10, right: 11, bottom: 12 }
        const bbox4: BoundingBox = { left: 15, top: 16, right: 13, bottom: 14 }

        beforeEach(() => {
          const item1 = createItem('item1', 'LogicGate', { boundingBox: bbox1 })
          const item2 = createItem('item2', 'LogicGate', { boundingBox: bbox2 })
          const item3 = createItem('item3', 'LogicGate', { boundingBox: bbox3 })
          const item4 = createItem('item4', 'Freeport', { boundingBox: bbox4 })

          invokeAction('setSnapBoundaries', createContext({
            commit,
            state: {
              ...createState(),
              items: { item1, item2, item3, item4 }
            }
          }), item3.id)
        })

        it('should not apply the bounding box of the item being dragged', () => {
          expect(commit).toHaveBeenCalledTimes(1)
          expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', expect.not.arrayContaining([bbox3]))
        })

        it('should not apply the bounding boxes of any freeports', () => {
          expect(commit).toHaveBeenCalledTimes(1)
          expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', expect.not.arrayContaining([bbox4]))
        })

        it('should apply the bounding boxes of all snappable items', () => {
          expect(commit).toHaveBeenCalledTimes(1)
          expect(commit).toHaveBeenCalledWith('SET_SNAP_BOUNDARIES', [bbox1, bbox2])
        })
      })
    })

  })

  describe('setItemPortPositions', () => {
    describe('when the item does not exist', () => {
      it('should not update any port positions', () => {
        const context = createContext({ commit })

        invokeAction('setItemPortPositions', context, 'item1')

        expect(commit).not.toHaveBeenCalled()
      })
    })

    describe('when no ports are present', () => {
      it('should not update any port positions', () => {
        const item1 = createItem('item1', 'LogicGate')
        const context = createContext({
          commit,
          state: {
            ...createState(),
            items: { item1 }
          }
        })

        invokeAction('setItemPortPositions', context, item1.id)

        expect(commit).not.toHaveBeenCalled()
      })
    })

    describe('when ports are present', () => {
      const item1 = createItem('item1', 'LogicGate', { portIds: ['leftPort', 'topPort', 'rightPort', 'bottomPort'] })
      const leftPort = createPort('leftPort', 'item1', PortType.Output, { orientation: 0 })
      const topPort = createPort('topPort', 'item1', PortType.Output, { orientation: 1 })
      const rightPort = createPort('rightPort', 'item1', PortType.Output, { orientation: 2 })
      const bottomPort = createPort('bottomPort', 'item1', PortType.Output, { orientation: 3 })

      beforeEach(() => {
        const context = createContext({
          commit,
          state: {
            ...createState(),
            ports: { leftPort, topPort, rightPort, bottomPort },
            items: { item1 }
          }
        })

        invokeAction('setItemPortPositions', context, item1.id)
      })

      it('should set the new positions of left ports', () => {
        expect(commit).toHaveBeenCalledWith('SET_PORT_POSITION', {
          id: leftPort.id,
          position: {
            x: expect.any(Number),
            y: expect.any(Number)
          }
        })
      })

      it('should set the new positions of right ports', () => {
        expect(commit).toHaveBeenCalledWith('SET_PORT_POSITION', {
          id: leftPort.id,
          position: {
            x: expect.any(Number),
            y: expect.any(Number)
          }
        })
      })

      it('should set the new positions of top ports', () => {
        expect(commit).toHaveBeenCalledWith('SET_PORT_POSITION', {
          id: leftPort.id,
          position: {
            x: expect.any(Number),
            y: expect.any(Number)
          }
        })
      })

      it('should set the new positions of bottom ports', () => {
        expect(commit).toHaveBeenCalledWith('SET_PORT_POSITION', {
          id: leftPort.id,
          position: {
            x: expect.any(Number),
            y: expect.any(Number)
          }
        })
      })
    })
  })

  describe('setItemPosition', () => {
    const position = { x: 210, y: 452 }
    const item1 = createItem('item1', 'LogicGate', {
      portIds: ['port1'],
      position: { x: 10, y: 25 },
      groupId: 'group1'
    })
    const port1 = createPort('port1', 'item1', PortType.Input, {
      position: { x: 10, y: 25 }
    })
    const context = createContext({
      commit,
      dispatch,
      state: {
        ...createState(),
        items: { item1 },
        ports: { port1 }
      }
    })

    describe('when the item is part of a group', () => {
      it('should move its entire group if the sender of the action was not its own group', () => {
        invokeAction('setItemPosition', context, { id: 'item1', position, isMovedByGroup: false })

        expect(commit).not.toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith('moveGroupPosition', {
          id: item1.groupId,
          delta: {
            x: position.x - item1.position.x,
            y: position.y - item1.position.y
          }
        })
      })

      it('should move the item itself if the action sender was its own group', () => {
        invokeAction('setItemPosition', context, { id: 'item1', position, isMovedByGroup: true })

        expect(dispatch).not.toHaveBeenCalled()
        expect(commit).toHaveBeenCalledWith('SET_ELEMENT_POSITION', { id: 'item1', position })
      })
    })

    describe('when the item is not part of a group', () => {
      const position = { x: 210, y: 452 }
      const item1 = createItem('item1', 'LogicGate', {
        portIds: ['port1'],
        position: { x: 10, y: 25 }
      })
      const port1 = createPort('port1', 'item1', PortType.Input, { position: { x: 10, y: 25 } })

      beforeEach(() => {
        const context = createContext({
          commit,
          dispatch,
          state: {
            ...createState(),
            items: { item1 },
            ports: { port1 }
          }
        })

        invokeAction('setItemPosition', context, { id: 'item1', position })
      })

      it('should commit the cached state', () => {
        expect(commit).toHaveBeenCalledWith('COMMIT_CACHED_STATE')
      })

      it('should update the item\'s position to the new one provided', () => {
        expect(commit).toHaveBeenCalledWith('SET_ELEMENT_POSITION', {
          id: item1.id,
          position
        })
      })

      it('should move the bounding box of the item to the distance changed', () => {
        expect(commit).toHaveBeenCalledWith('SET_ELEMENT_BOUNDING_BOX', {
          id: item1.id,
          boundingBox: {
            left: item1.boundingBox.left + (position.x - item1.position.x),
            top: item1.boundingBox.top + (position.y - item1.position.y),
            right: item1.boundingBox.left + (position.x - item1.position.x),
            bottom: item1.boundingBox.bottom + (position.y - item1.position.y)
          }
        })
      })

      it('should update the position of the ports according to the distance changed', () => {
        expect(commit).toHaveBeenCalledWith('SET_PORT_POSITION', {
          id: port1.id,
          position: {
            x: port1.position.x + (position.x - item1.position.x),
            y: port1.position.y + (position.y - item1.position.y)
          }
        })
      })
    })
  })

  describe('moveGroupPosition', () => {
    const delta = { x: 42, y: -15 }
    const item1 = createItem('item1', 'LogicGate', {
      position: { x: 10, y: 25 }
    })
    const group1 = createGroup('group1', ['item1'])

    beforeEach(() => {
      const context = createContext({
        commit,
        dispatch,
        state: {
          ...createState(),
          items: { item1 },
          groups: { group1 }
        }
      })

      invokeAction('moveGroupPosition', context, { id: 'group1', delta })
    })

    it('should commit the cached state', () => {
      expect(commit).toHaveBeenCalledWith('COMMIT_CACHED_STATE')
    })

    it('should move the bounding box of the group augmented by the distance changed', () => {
      expect(commit).toHaveBeenCalledWith('SET_GROUP_BOUNDING_BOX', {
        id: group1.id,
        boundingBox: {
          left: group1.boundingBox.left + delta.x,
          top: group1.boundingBox.top + delta.y,
          right: group1.boundingBox.right + delta.x,
          bottom: group1.boundingBox.bottom + delta.y
        }
      })
    })

    it('should update the position of the group\'s items augmented by the distance changed', () => {
      expect(dispatch).toHaveBeenCalledWith('setItemPosition', {
        id: item1.id,
        isMovedByGroup: true,
        position: {
          x: item1.position.x + delta.x,
          y: item1.position.y + delta.y
        }
      })
    })
  })

  describe('setItemBoundingBox', () => {
    it('should not commit anything if the item does not exist', () => {
      invokeAction('setItemBoundingBox', createContext({ commit }), 'item1')

      expect(commit).not.toHaveBeenCalled()
    })

    it('should set the bounding box according to the one computed', () => {
      const boundingBox: BoundingBox = {
        left: 12,
        top: 42,
        right: 100,
        bottom: 231
      }
      const item1 = createItem('item1', 'LogicGate')
      const context = createContext({
        commit,
        state: {
          ...createState(),
          items: { item1 }
        }
      })

      jest
        .spyOn(boundaries, 'getItemBoundingBox')
        .mockReturnValue(boundingBox)

      invokeAction('setItemBoundingBox', context, item1.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_ELEMENT_BOUNDING_BOX', {
        id: 'item1',
        boundingBox
      })
    })
  })

  describe('setGroupBoundingBox', () => {
    it('should not commit anything if the item does not exist', () => {
      invokeAction('setGroupBoundingBox', createContext({ commit }), 'group1')

      expect(commit).not.toHaveBeenCalled()
    })

    it('should set the bounding box according to the one computed', () => {
      const boundingBox: BoundingBox = {
        left: 12,
        top: 42,
        right: 100,
        bottom: 231
      }
      const item1 = createItem('item1', 'LogicGate')
      const group1 = createGroup('group1', ['item1'])
      const context = createContext({
        commit,
        state: {
          ...createState(),
          items: { item1 },
          groups: { group1 }
        }
      })

      jest
        .spyOn(boundaries, 'getGroupBoundingBox')
        .mockReturnValue(boundingBox)

      invokeAction('setGroupBoundingBox', context, group1.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_GROUP_BOUNDING_BOX', {
        id: 'group1',
        boundingBox
      })
    })
  })

  describe('group', () => {
    const item1 = createItem('item1', 'LogicGate', { isSelected: true })
    const item2 = createItem('item2', 'LogicGate', { groupId: 'group1', isSelected: true })
    const item3 = createItem('item3', 'LogicGate', { isSelected: false })
    const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true })
    const connection2 = createConnection('connection2', 'port3', 'port4', { groupId: 'group1', isSelected: true })
    const connection3 = createConnection('connection3', 'port5', 'port6', { isSelected: false })

    beforeEach(() => {
      const context = createContext({
        state: {
          ...createState(),
          items: { item1, item2 , item3 },
          connections: { connection1, connection2, connection3 }
        },
        commit,
        dispatch
      })

      invokeAction('group', context)
    })

    it('should commit the undo-able state', () => {
      expect(dispatch).toHaveBeenCalledWith('commitState')
    })

    it('should destroy the groups of any selected items for which they are a member of', () => {
      expect(commit).toHaveBeenCalledWith('UNGROUP', 'group1')
    })

    it('should only group items and connections that are selected', () => {
      expect(commit).toHaveBeenCalledWith('GROUP_ITEMS', {
        id: expect.any(String),
        itemIds: ['item1', 'item2'],
        connectionIds: ['connection1', 'connection2'],
        isSelected: true
      })
    })

    it('should set the bounding box of the new group', () => {
      expect(dispatch).toHaveBeenCalledWith('setGroupBoundingBox', expect.any(String))
    })
  })

  describe('ungroup', () => {
    const group1 = createGroup('group1', [], { isSelected: true })
    const group2 = createGroup('group2', [], { isSelected: false })

    beforeEach(() => {
      const context = createContext({
        state: {
          ...createState(),
          groups: { group1, group2 }
        },
        commit,
        dispatch
      })

      invokeAction('ungroup', context)
    })

    it('should commit the undo-able state', () => {
      expect(dispatch).toHaveBeenCalledWith('commitState')
    })

    it('should destroy a selected group', () => {
      expect(commit).toHaveBeenCalledWith('UNGROUP', 'group1')
    })

    it('should not destroy groups that are not selected', () => {
      expect(commit).not.toHaveBeenCalledWith('UNGROUP', 'group2')
    })
  })

  describe('deselectAll', () => {
    it('should set all selection states to false', () => {
      invokeAction('deselectAll', createContext({ commit }))

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_ALL_SELECTION_STATES', false)
    })
  })

  describe('selectAll', () => {
    it('should set all selection states to true', () => {
      invokeAction('selectAll', createContext({ commit }))

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_ALL_SELECTION_STATES', true)
    })
  })

  describe('createSelection', () => {
    it('should not select anything if the selection is not a valid two-dimensional rectangle', () => {
      invokeAction('createSelection', createContext({ commit, dispatch }), {
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
      })

      expect(commit).not.toHaveBeenCalled()
      expect(dispatch).not.toHaveBeenCalled()
    })

    describe('when the selection is a two-dimensional rectangle', () => {
      const port = createPort('port', 'item1', PortType.Input)
      const item1 = createItem('item1', 'LogicGate')
      const item2 = createItem('item2', 'LogicGate')
      const connection1 = createConnection('connection1', 'port', 'port')
      const connection2 = createConnection('connection2', 'port', 'port')

      beforeEach(() => {
        jest
          .spyOn(boundaries, 'hasIntersection')
          .mockReturnValueOnce(true) // item1 is in rect
          .mockReturnValueOnce(false) // item2 is not in rect
          .mockReturnValueOnce(true) // connection1 is in rect
          .mockReturnValueOnce(false) // connection2 is not in rect

        const context = createContext({
          commit,
          dispatch,
          state: {
            ...createState(),
            items: { item1, item2 },
            connections: { connection1, connection2 },
            ports: { port }
          }
        })

        invokeAction('createSelection', context, {
          left: 10,
          top: 10,
          right: 100,
          bottom: 100
        })
      })

      it('should select all items that lie within the selection boundary', () => {
        expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', {
          id: item1.id,
          isSelected: true
        })
      })

      it('should select all connections that lie within the selection boundary', () => {
        expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', {
          id: connection1.id,
          isSelected: true
        })
      })

      it('should not select a connection that lies outside the selection boundary', () => {
        expect(commit).not.toHaveBeenCalledWith('SET_SELECTION_STATE', {
          id: connection2.id,
          isSelected: true
        })
      })

      it('should select the connections of all items that lie within the selection boundary', () => {
        expect(dispatch).toHaveBeenCalledWith('selectItemConnections', [item1.id])
      })
    })
  })

  describe('selectItemConnections', () => {
    const item1 = createItem('item1', 'LogicGate', { portIds: ['port1'] })
    const item2 = createItem('item2', 'LogicGate', { portIds: ['port2'] })
    const item3 = createItem('item3', 'LogicGate', { portIds: ['port3'] })
    const item4 = createItem('item4', 'LogicGate', { portIds: ['port4'] })
    const port1 = createPort('port1', 'item1', PortType.Output)
    const port2 = createPort('port2', 'item2', PortType.Input)
    const port3 = createPort('port3', 'item3', PortType.Output)
    const port4 = createPort('port4', 'item4', PortType.Input)
    const connection1 = createConnection('connection1', 'port1', 'port2')
    const connection2 = createConnection('connection2', 'port3', 'port4')
    const context = createContext({
      commit,
      state: {
        ...createState(),
        items: { item1, item2, item3, item4 },
        ports: { port1, port2, port3, port4 },
        connections: { connection1, connection2 }
      }
    })

    it('should select a connection whose source is an item in the given list', () => {
      invokeAction('selectItemConnections', context, [item1.id])

      expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: connection1.id, isSelected: true })
    })

    it('should select a connection whose target is an item in the given list', () => {
      invokeAction('selectItemConnections', context, [item2.id])

      expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: connection1.id, isSelected: true })
    })

    it('should not select a connection where neither its target nor its source is an item in the given list', () => {
      invokeAction('selectItemConnections', context, [item1.id, item2.id])

      expect(commit).not.toHaveBeenCalledWith('SET_SELECTION_STATE', { id: connection2.id, isSelected: true })
    })
  })

  describe('toggleSelectionState', () => {
    describe('when the element is part of a larger group', () => {
      const groupId = 'group1'
      const item1 = createItem('item1', 'LogicGate', { groupId })
      const item2 = createItem('item2', 'LogicGate', { groupId })
      const connection1 = createConnection('connection1', 'port1', 'port2', { groupId })
      const connection2 = createConnection('connection2', 'port3', 'port4')
      const group1 = createGroup('group1', ['item1', 'item2'], { connectionIds: ['connection1'] })

      beforeEach(() => {
        const context = createContext({
          state: {
            ...createState(),
            items: { item1, item2 },
            connections: { connection1, connection2 },
            groups: { group1 }
          },
          commit
        })

        invokeAction('toggleSelectionState', context, { id: 'item1', forcedValue: true })
      })

      it('should select all the elements and connections within that group', () => {
        expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: 'item1', isSelected: true })
        expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: 'item2', isSelected: true })
        expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: 'connection1', isSelected: true })
      })

      it('should not select elements outside the group for which the item is a member of', () => {
        expect(commit).not.toHaveBeenCalledWith('SET_SELECTION_STATE', {
          id: 'connection2',
          isSelected: expect.any(Boolean)
        })
      })

      it('should select the group', () => {
        expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: 'group1', isSelected: true })
      })
    })

    it('should select only the element when the element is not a member of any group', () => {
      const item1 = createItem('item1', 'LogicGate')
      const context = createContext({
        state: {
          ...createState(),
          items: { item1 }
        },
        commit
      })

      invokeAction('toggleSelectionState', context, { id: 'item1', isSelected: true })

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: 'item1', isSelected: true })
    })

    it('should invert the selection value of the element if no value is forced', () => {
      const item1 = createItem('item1', 'LogicGate', { isSelected: true })
      const context = createContext({
        state: {
          ...createState(),
          items: { item1 }
        },
        commit
      })

      invokeAction('toggleSelectionState', context, { id: 'item1' })

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_SELECTION_STATE', { id: 'item1', isSelected: false })
    })

    it('should not change the selection of an element that does not exist', () => {
      const context = createContext({ commit })

      invokeAction('toggleSelectionState', context, { id: 'non-existing-id' })

      expect(commit).not.toHaveBeenCalled()
    })
  })

  describe('rotate', () => {
    describe('rotating a group', () => {
      const item1 = createItem('item1', 'LogicGate', { groupId: 'group1' })
      const item2 = createItem('item2', 'LogicGate', { groupId: 'group1' })
      const group1 = createGroup('group1', ['item1', 'item2'], { isSelected: true })
      const group2 = createGroup('group2', [], { isSelected: false })

      beforeEach(() => {
        const context = createContext({
          state: {
            ...createState(),
            items: { item1, item2 },
            groups: { group1, group2 }
          },
          commit,
          dispatch
        })

        invokeAction('rotate', context, 1)
      })

      it('should commit the undo-able state', () => {
        expect(dispatch).toHaveBeenCalledWith('commitState')
      })

      it('should set the rotations of the items', () => {
        expect(commit).toHaveBeenCalledWith('ROTATE_ELEMENT', {
          id: 'item1',
          rotation: 1
        })
        expect(commit).toHaveBeenCalledWith('ROTATE_ELEMENT', {
          id: 'item2',
          rotation: 1
        })
      })

      it('should set the new positions of all items within the group', () => {
        expect(dispatch).toHaveBeenCalledWith('setItemPosition', {
          id: 'item1',
          position: {
            x: expect.any(Number),
            y: expect.any(Number)
          },
          isMovedByGroup: true
        })
        expect(dispatch).toHaveBeenCalledWith('setItemPosition', {
          id: 'item2',
          position: {
            x: expect.any(Number),
            y: expect.any(Number)
          },
          isMovedByGroup: true
        })
      })

      it('should update the items\' bounding boxes', () => {
        expect(dispatch).toHaveBeenCalledWith('setItemBoundingBox', 'item1')
        expect(dispatch).toHaveBeenCalledWith('setItemBoundingBox', 'item2')
      })

      it('should update the items\' port positions', () => {
        expect(dispatch).toHaveBeenCalledWith('setItemPortPositions', 'item1')
        expect(dispatch).toHaveBeenCalledWith('setItemPortPositions', 'item2')
      })

      it('should update the group\'s bounding box', () => {
        expect(dispatch).toHaveBeenCalledWith('setGroupBoundingBox', 'group1')
      })

      it('should not mutate a group which is not selected', () => {
        expect(dispatch).not.toHaveBeenCalledWith('setGroupBoundingBox', 'group2')
      })
    })

    describe('rotating an individual item', () => {
      const item1 = createItem('item1', 'LogicGate', { isSelected: true })

      beforeEach(() => {
        const context = createContext({
          state: {
            ...createState(),
            items: { item1 }
          },
          commit,
          dispatch
        })

        invokeAction('rotate', context, 1)
      })

      it('should commit the undo-able state', () => {
        expect(dispatch).toHaveBeenCalledWith('commitState')
      })

      it('should set the rotation of the item', () => {
        expect(commit).toHaveBeenCalledWith('ROTATE_ELEMENT', {
          id: 'item1',
          rotation: 1
        })
      })

      it('should update the item\'s bounding box', () => {
        expect(dispatch).toHaveBeenCalledWith('setItemBoundingBox', 'item1')
      })

      it('should update the item\'s port position', () => {
        expect(dispatch).toHaveBeenCalledWith('setItemPortPositions', 'item1')
      })
    })
  })

  describe('removeFreeport', () => {
    describe('when a connection is connected at both the target and the source', () => {
      beforeEach(() => {
        const context = createContext({
          commit,
          state: {
            ...createState(),
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
              'item1': createItem('item1', 'InputNode', { portIds: ['port1'] }),
              'item2': createItem('item2', 'OutputNode', { portIds: ['port4'] }),
              'freeport': createItem('freeport', 'Freeport', { portIds: ['port2', 'port3'] })
            }
          }
        })

        invokeAction('removeFreeport', context, 'freeport')
      })

      it('should disconnect the freeport from its source', () => {
        expect(commit).toHaveBeenCalledWith('DISCONNECT', { source: 'port1', target: 'port2' })
      })

      it('should disconnect the freeport from its target', () => {
        expect(commit).toHaveBeenCalledWith('DISCONNECT', { source: 'port3', target: 'port4' })
      })

      it('should connect the freeport\'s original source to its original target', () => {
        expect(commit).toHaveBeenCalledWith('CONNECT', { source: 'port1', target: 'port4' })
      })

      it('should remove the item and the circuit node from the document', () => {
        expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'freeport')
        expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        const context = createContext({
          commit,
          state: {
            ...createState(),
            connections: {
              'connection1': createConnection('connection1', 'port1', 'port2')
            },
            ports: {
              'port1': createPort('port1', 'item1', PortType.Output),
              'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
              'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true })
            },
            items: {
              'item1': createItem('item1', 'InputNode', { portIds: ['port1'] }),
              'freeport': createItem('freeport', 'Freeport', { portIds: ['port2', 'port3'] })
            }
          }
        })

        invokeAction('removeFreeport', context, 'freeport')
      })

      it('should only disconnect the freeport from its source', () => {
        expect(commit).toHaveBeenCalledWith('DISCONNECT', { source: 'port1', target: 'port2' })
      })

      it('should remove the item and the circuit node from the document', () => {
        expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'freeport')
        expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        const context = createContext({
          commit,
          state: {
            ...createState(),
            connections: {
              'connection2': createConnection('connection2', 'port3', 'port4')
            },
            ports: {
              'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
              'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true }),
              'port4': createPort('port4', 'item2', PortType.Input)
            },
            items: {
              'freeport': createItem('freeport', 'Freeport', { portIds: ['port2', 'port3'] }),
              'item2': createItem('item2', 'OutputNode', { portIds: ['port4'] })
            }
          }
        })

        invokeAction('removeFreeport', context, 'freeport')
      })

      it('should only disconnect the freeport from its target', () => {
        expect(commit).toHaveBeenCalledWith('DISCONNECT', { source: 'port3', target: 'port4' })
      })

      it('should remove the item and the circuit node from the document', () => {
        expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'freeport')
        expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'freeport')
      })
    })
  })

  describe('createFreeport', () => {
    let context

    const itemId = 'freeport'
    const sourceId = 'source-port'
    const targetId = 'target-port'
    const connectionChainId = 'connection-chain'
    const inputPortId = 'freeport-input-port'
    const outputPortId = 'freeport-output-port'

    beforeEach(() => {
      context = createContext({
        commit,
        dispatch,
        state: createState()
      })
    })

    it('should not create a new freeport if an item having the same ID already exists', () => {
      invokeAction('createFreeport', createContext({
        commit,
        dispatch,
        state: {
          ...createState(),
          items: {
            [itemId]: createItem(itemId, 'Freeport')
          }
        }
      }), { itemId })

      expect(commit).not.toHaveBeenCalled()
      expect(dispatch).not.toHaveBeenCalled()
    })

    describe('when this freeport is a joint between two connection segments', () => {
      const data = {
        itemId,
        sourceId,
        targetId,
        inputPortId,
        outputPortId,
        connectionChainId
      }

      beforeEach(() => {
        invokeAction('createFreeport', context, data)
      })

      it('should commit the current state to be undo-able', () => {
        expect(dispatch).toHaveBeenCalledWith('commitState')
      })

      it('should deselect all items', () => {
        expect(dispatch).toHaveBeenCalledWith('deselectAll')
      })

      it('should create the new freeport', () => {
        expect(commit).toHaveBeenCalledWith('CREATE_FREEPORT_ELEMENT', data)
        expect(commit).toHaveBeenCalledWith('ADD_CIRCUIT_NODE', itemId)
        expect(dispatch).toHaveBeenCalledWith('setItemBoundingBox', itemId)
        expect(dispatch).toHaveBeenCalledWith('setActiveFreeportId', itemId)
      })

      it('should split the connection between the given source and target connection', () => {
        expect(commit).toHaveBeenCalledWith('DISCONNECT', { source: sourceId, target: targetId })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(commit).toHaveBeenCalledWith('CONNECT', { source: sourceId, target: inputPortId, connectionChainId })
        expect(commit).toHaveBeenCalledWith('CONNECT', { source: outputPortId, target: targetId, connectionChainId })
      })
    })

    describe('when this freeport is a port being dragged from an output port', () => {
      const data = {
        itemId,
        sourceId,
        inputPortId,
        connectionChainId
      }

      beforeEach(() => {
        invokeAction('createFreeport', context, data)
      })

      it('should not commit the current state to be undo-able', () => {
        expect(dispatch).not.toHaveBeenCalledWith('commitState')
      })

      it('should deselect all items', () => {
        expect(dispatch).toHaveBeenCalledWith('deselectAll')
      })

      it('should create the new freeport', () => {
        expect(commit).toHaveBeenCalledWith('CREATE_FREEPORT_ELEMENT', data)
        expect(commit).toHaveBeenCalledWith('ADD_CIRCUIT_NODE', itemId)
        expect(dispatch).toHaveBeenCalledWith('setItemBoundingBox', itemId)
        expect(dispatch).toHaveBeenCalledWith('setActiveFreeportId', itemId)
      })

      it('should not disconnect any connections', () => {
        expect(commit).not.toHaveBeenCalledWith('DISCONNECT', expect.any(Object))
      })

      it('should not reconnect the target port to anything', () => {
        expect(commit).not.toHaveBeenCalledWith('SCONNECT', {
          source: expect.any(String),
          target: targetId,
          connectionChainId
        })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(commit).toHaveBeenCalledWith('CONNECT', { source: sourceId, target: inputPortId, connectionChainId })
      })
    })

    describe('when this freeport is a port being dragged from an input port', () => {
      const data = {
        itemId,
        targetId,
        outputPortId,
        connectionChainId
      }

      beforeEach(() => {
        invokeAction('createFreeport', context, data)
      })

      it('should not commit the current state to be undo-able', () => {
        expect(dispatch).not.toHaveBeenCalledWith('commitState')
      })

      it('should deselect all items', () => {
        expect(dispatch).toHaveBeenCalledWith('deselectAll')
      })

      it('should create the new freeport', () => {
        expect(commit).toHaveBeenCalledWith('CREATE_FREEPORT_ELEMENT', data)
        expect(commit).toHaveBeenCalledWith('ADD_CIRCUIT_NODE', itemId)
        expect(dispatch).toHaveBeenCalledWith('setItemBoundingBox', itemId)
        expect(dispatch).toHaveBeenCalledWith('setActiveFreeportId', itemId)
      })

      it('should not disconnect any connections', () => {
        expect(commit).not.toHaveBeenCalledWith('DISCONNECT', expect.any(Object))
      })

      it('should not reconnect the source port to anything', () => {
        expect(commit).not.toHaveBeenCalledWith('CONNECT', {
          source: sourceId,
          target: expect.any(String),
          connectionChainId
        })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(commit).toHaveBeenCalledWith('CONNECT', { source: outputPortId, target: targetId, connectionChainId })
      })
    })
  })

  describe('connectFreeport', () => {
    describe('when there is a port in the neighborhood', () => {
      const sourceId = 'source-id'
      const targetId = 'target-id'
      const portId = 'port-id'
      const newPortId = 'new-port-id'

      const createLocalContext = (connectablePortIds: string[] = []) => createContext({
        commit,
        dispatch,
        state: {
          ...createState(),
          ports: {
            [sourceId]: createPort(sourceId, '2', PortType.Input),
            [targetId]: createPort(sourceId, '2', PortType.Output),
            [newPortId]: createPort(newPortId, '2', PortType.Output),
            [portId]: createPort(portId, '1', PortType.Input)
          },
          connectablePortIds
        }
      })

      beforeEach(() => {
        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(true)
      })

      it('should not connect the port to itself or to one that is not in the predefined set of connectable ports', () => {
        invokeAction('connectFreeport', createLocalContext(), { sourceId, portId })

        expect(commit).not.toHaveBeenCalledWith('commitState')
        expect(commit).not.toHaveBeenCalledWith('CONNECT', expect.any(Object))
        expect(commit).not.toHaveBeenCalledWith('DISCONNECT', expect.any(Object))
      })

      describe('when a connection is being made from an output port (acting as a source)', () => {
        beforeEach(() => {
          invokeAction('connectFreeport', createLocalContext([newPortId]), { sourceId, portId })
        })

        it('should disconnect the temporary dragged port from the source', () => {
          expect(commit).toHaveBeenCalledWith('DISCONNECT', {
            source: sourceId,
            target: portId
          })
        })

        it('should connect the the source to the discovered target', () => {
          expect(commit).toHaveBeenCalledWith('CONNECT', {
            source: sourceId,
            target: newPortId
          })
        })
      })

      describe('when a connection is being made from an input port (acting as a target) to a receiving output port', () => {
        beforeEach(() => {
          invokeAction('connectFreeport', createLocalContext([newPortId]), { targetId, portId })
        })

        it('should disconnect the temporary dragged port from the old target', () => {
          expect(commit).toHaveBeenCalledWith('DISCONNECT', {
            source: portId,
            target: targetId
          })
        })

        it('should connect the the source to the new discovered source', () => {
          expect(commit).toHaveBeenCalledWith('CONNECT', {
            source: newPortId,
            target: targetId
          })
        })
      })

      describe('when any connectable port is discovered', () => {
        beforeEach(() => {
          invokeAction('connectFreeport', createLocalContext([newPortId]), { sourceId, portId })
        })

        it('should commit the undoable state', () => {
          expect(dispatch).toHaveBeenCalledWith('commitState')
        })

        it('should clear the active freeport ID', () => {
          expect(dispatch).toHaveBeenCalledWith('setActiveFreeportId', null)
        })

        it('should clear the list of connectable port IDs', () => {
          expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', [])
        })
      })

      describe('when an item owns the given port', () => {
        const itemId = 'item-id'
        const otherItemId = 'other-item-id'

        beforeEach(() => {
          const context = createLocalContext()

          context.state.items = {
            [itemId]: createItem(itemId, 'Freeport', { portIds: [portId] }),
            [otherItemId]: createItem(otherItemId, 'Freeport', { portIds: [sourceId, targetId] })
          }

          invokeAction('connectFreeport', context, { sourceId, portId })
        })

        it('should remove the item and its circuit node', () => {
          expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', itemId)
          expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', itemId)
        })

        it('should not remove any other items or their circuit nodes', () => {
          expect(commit).not.toHaveBeenCalledWith('REMOVE_ELEMENT', otherItemId)
          expect(commit).not.toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', otherItemId)
        })
      })
    })
  })

  describe('setConnectablePortIds', () => {
    const portId = 'port-id'
    const createLocalContext = (sourcePort: Port, targetPort: Port, state = {}) => createContext({
      commit,
      dispatch,
      state: {
        ...createState(),
        ports: {
          [sourcePort.id]: sourcePort,
          [targetPort.id]: targetPort
        },
        ...state
      }
    })

    it('should include an input port if the source port is an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort), sourcePort.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', ['target-port'])
    })

    it('should not include an output port if the source port is also an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Output)

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort), sourcePort.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', [])
    })

    it('should not include a target port that is already connected', () => {
      const connectedTargetPort = createPort('conn-port', '0', PortType.Output)
      const connectedSourcePort = createPort('conn-port-2', '3', PortType.Input)
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)
      const connection1 = createConnection('conn1', connectedSourcePort.id, connectedTargetPort.id)
      const connection2 = createConnection('conn2', connectedSourcePort.id, targetPort.id)

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort, {
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
      }), sourcePort.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', [])
    })

    it('should not include a target port that is already connected', () => {
      const connectedTargetPort = createPort('conn-port', '0', PortType.Output)
      const connectedSourcePort = createPort('conn-port-2', '3', PortType.Input)
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)
      const connection1 = createConnection('conn1', connectedSourcePort.id, connectedTargetPort.id)
      const connection2 = createConnection('conn2', connectedSourcePort.id, targetPort.id)

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort, {
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
      }), sourcePort.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', [])
    })

    it('should not include a target port that is a freeport', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input, { isFreeport: true })

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort), sourcePort.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', [])
    })

    it('should not allow a source port to connect to anything if it is a freeport', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output, { isFreeport: true })
      const targetPort = createPort('target-port', '2', PortType.Input)

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort), sourcePort.id)

      expect(commit).not.toHaveBeenCalled()
    })

    it('should include an output port if the source port is an input port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Input)
      const targetPort = createPort('target-port', '2', PortType.Output)

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort), sourcePort.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', ['target-port'])
    })

    it('should not include an output port if the source port is also an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Output)

      invokeAction('setConnectablePortIds', createLocalContext(sourcePort, targetPort), sourcePort.id)

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_CONNECTABLE_PORT_IDS', [])
    })
  })

  describe('setOscilloscopeVisibility', () => {
    const id = 'item1'

    it('should add the item to the oscilloscope monitor when the value is true', () => {
      invokeAction('setOscilloscopeVisibility', createContext({ commit }), { id, value: true })

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('ADD_TO_OSCILLOSCOPE', id)
    })

    it('should remove the item from the oscilloscope monitor when the value is false', () => {
      invokeAction('setOscilloscopeVisibility', createContext({ commit }), { id, value: false })

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('REMOVE_FROM_OSCILLOSCOPE', id)
    })
  })

  describe('setInputCount', () => {
    const id = 'item1'
    const port1 = createPort('port1', id, PortType.Input)
    const port2 = createPort('port2', id, PortType.Output)
    const port3 = createPort('port3', id, PortType.Input)
    const item1 = createItem(id, 'InputNode', {
      portIds: [port1.id, port2.id, port3.id],
      properties: {
        inputCount: {
          value: 2,
          type: 'number',
          label: 'Input Count'
        }
      }
    })
    const context = createContext({
      state: {
        ...createState(),
        items: { item1 },
        ports: { port1, port2, port3 }
      },
      commit,
      dispatch
    })

    describe('when the input count is increased', () => {
      beforeEach(() => {
        invokeAction('setInputCount', context, { id, count: 4 })
      })

      it('should add the difference number of input ports', () => {
        expect(commit).toHaveBeenCalledTimes(2)
        expect(commit).toHaveBeenCalledWith('ADD_PORT', {
          id: expect.any(String),
          type: PortType.Input,
          elementId: id,
          orientation: Direction.Left,
          isFreeport: false,
          position: {
            x: 0,
            y: 0
          },
          rotation: 0,
          value: 0
        })
      })

      it('should set the item port positions', () => {
        expect(dispatch).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith('setItemPortPositions', id)
      })
    })

    describe('when the input count is decreased', () => {
      beforeEach(() => {
        invokeAction('setInputCount', context, { id, count: 1 })
      })

      it('should remove the difference number of input ports at the end of the list', () => {
        expect(commit).toHaveBeenCalledTimes(1)
        expect(commit).toHaveBeenCalledWith('REMOVE_PORT', port3.id)
      })

      it('should set the item port positions', () => {
        expect(dispatch).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith('setItemPortPositions', id)
      })
    })
  })

  describe('setProperties', () => {
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

    it('should not change anything if no properties have changed', () => {
      const properties = createProperties()
      const item1 = createItem(id, 'LogicGate', { properties })
      const context = createContext({
        state: {
          ...createState(),
          items: { item1 }
        },
        commit,
        dispatch
      })

      invokeAction('setProperties', context, { id, properties })

      expect(commit).not.toHaveBeenCalled()
      expect(dispatch).not.toHaveBeenCalled()
    })

    it('should dispatch setOscilloscopeVisibility when the showInOscilloscope has changed', () => {
      const item1 = createItem(id, 'LogicGate', { properties: createProperties() })
      const context = createContext({
        state: {
          ...createState(),
          items: { item1 }
        },
        commit,
        dispatch
      })
      const properties = createProperties()
      properties.showInOscilloscope.value = false

      invokeAction('setProperties', context, { id, properties })

      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith('setOscilloscopeVisibility', { id, value: false })
    })

    it('should dispatch setInputCount when the inputCount has changed', () => {
      const item1 = createItem(id, 'LogicGate', { properties: createProperties() })
      const context = createContext({
        state: {
          ...createState(),
          items: { item1 }
        },
        commit,
        dispatch
      })
      const properties = createProperties()
      properties.inputCount.value = 3

      invokeAction('setProperties', context, { id, properties })

      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith('setInputCount', { id, count: 3 })
    })

    it('should set the new item property value', () => {
      const propertyName = 'name'
      const value = 'New value'
      const item1 = createItem(id, 'LogicGate', { properties: createProperties() })
      const context = createContext({
        state: {
          ...createState(),
          items: { item1 }
        },
        commit,
        dispatch
      })
      const properties = createProperties()
      properties[propertyName].value = value

      invokeAction('setProperties', context, { id, properties })

      expect(commit).toHaveBeenCalledTimes(1)
      expect(commit).toHaveBeenCalledWith('SET_ITEM_PROPERTY', { id, propertyName, value })
    })
  })
})
