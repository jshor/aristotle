import { ActionContext, ActionHandler } from 'vuex'
import actions from './actions'
import DocumentState from './DocumentState'
import CircuitService from '../services/CircuitService'
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

  beforeEach(() => jest.resetAllMocks())

  describe('setZoom()', () => {
    it('should set the zoom to the given value', () => {
      invokeAction('setZoom', createContext({ commit }), 1)

      expect(commit).toHaveBeenCalledWith('SET_ZOOM', 1)
    })
  })

  describe('deleteSelection()', () => {
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
      expect(dispatch).toHaveBeenCalledWith('disconnect', { source: 'port5', target: 'port6' })
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

  describe('setSnapBoundaries()', () => {
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
  })

  describe('removeFreeport()', () => {
    describe('when a connection is connected at both the target and the source', () => {
      beforeEach(() => {
        const context = createContext({
          commit,
          dispatch,
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
        expect(dispatch).toHaveBeenCalledWith('disconnect', { source: 'port1', target: 'port2' })
      })

      it('should disconnect the freeport from its target', () => {
        expect(dispatch).toHaveBeenCalledWith('disconnect', { source: 'port3', target: 'port4' })
      })

      it('should connect the freeport\'s original source to its original target', () => {
        expect(dispatch).toHaveBeenCalledWith('connect', { source: 'port1', target: 'port4' })
      })

      it('should remove the item and the circuit node from the document', () => {
        expect(commit).toHaveBeenCalledTimes(2)
        expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'freeport')
        expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        const context = createContext({
          commit,
          dispatch,
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
        expect(dispatch).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith('disconnect', { source: 'port1', target: 'port2' })
      })

      it('should remove the item and the circuit node from the document', () => {
        expect(commit).toHaveBeenCalledTimes(2)
        expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'freeport')
        expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        const context = createContext({
          commit,
          dispatch,
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
        expect(dispatch).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith('disconnect', { source: 'port3', target: 'port4' })
      })

      it('should remove the item and the circuit node from the document', () => {
        expect(commit).toHaveBeenCalledTimes(2)
        expect(commit).toHaveBeenCalledWith('REMOVE_CIRCUIT_NODE', 'freeport')
        expect(commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'freeport')
      })
    })
  })

  describe('createFreeport()', () => {
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
        expect(dispatch).toHaveBeenCalledWith('disconnect', { source: sourceId, target: targetId })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(dispatch).toHaveBeenCalledWith('connect', { source: sourceId, target: inputPortId, connectionChainId })
        expect(dispatch).toHaveBeenCalledWith('connect', { source: outputPortId, target: targetId, connectionChainId })
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
        expect(dispatch).not.toHaveBeenCalledWith('disconnect', expect.any(Object))
      })

      it('should not reconnect the target port to anything', () => {
        expect(dispatch).not.toHaveBeenCalledWith('connect', {
          source: expect.any(String),
          target: targetId,
          connectionChainId
        })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(dispatch).toHaveBeenCalledWith('connect', { source: sourceId, target: inputPortId, connectionChainId })
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
        expect(dispatch).not.toHaveBeenCalledWith('disconnect', expect.any(Object))
      })

      it('should not reconnect the source port to anything', () => {
        expect(dispatch).not.toHaveBeenCalledWith('connect', {
          source: sourceId,
          target: expect.any(String),
          connectionChainId
        })
      })

      it('should re-connect the source and the target to the newly-created freeport ports', () => {
        expect(dispatch).toHaveBeenCalledWith('connect', { source: outputPortId, target: targetId, connectionChainId })
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
        expect(commit).not.toHaveBeenCalledWith('connect', expect.any(Object))
        expect(dispatch).not.toHaveBeenCalledWith('disconnect', expect.any(Object))
      })

      describe('when a connection is being made from an output port (acting as a source)', () => {
        beforeEach(() => {
          invokeAction('connectFreeport', createLocalContext([newPortId]), { sourceId, portId })
        })

        it('should disconnect the temporary dragged port from the source', () => {
          expect(dispatch).toHaveBeenCalledWith('disconnect', {
            source: sourceId,
            target: portId
          })
        })

        it('should connect the the source to the discovered target', () => {
          expect(dispatch).toHaveBeenCalledWith('connect', {
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
          expect(dispatch).toHaveBeenCalledWith('disconnect', {
            source: portId,
            target: targetId
          })
        })

        it('should connect the the source to the new discovered source', () => {
          expect(dispatch).toHaveBeenCalledWith('connect', {
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
})
