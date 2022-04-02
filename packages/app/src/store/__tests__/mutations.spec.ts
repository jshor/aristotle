import mutations from '../mutations'
import DocumentState from '../DocumentState'
import SimulationService from '../../services/SimulationService'
import Direction from '../../types/enums/Direction'
import ItemType from '@/types/enums/ItemType'
import PortType from '../../types/enums/PortType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import BinaryWaveService from '@/services/BinaryWaveService'
import {
  createConnection,
  createGroup,
  createItem,
  createPort,
  createState
} from './__helpers__/helpers'

const createSerializedState = () => {
  const state = createState()

  return JSON.stringify({
    connections: state.connections,
    items: state.items,
    ports: state.ports,
    groups: state.groups
  })
}

beforeEach(() => {
  mutations.commit = jest.fn()
  jest.resetAllMocks()
})

describe('mutations', () => {
  describe('SET_ZOOM', () => {
    it('should set the zoom to the given value', () => {
      const state = createState()

      mutations.SET_ZOOM(state, 1.2)

      expect(state.zoomLevel).toEqual(1.2)
    })
  })

  describe('CACHE_STATE', () => {
    it('should set the cached state to a stringified object containing the connections, items, ports, and groups', () => {
      const state = createState()

      mutations.CACHE_STATE(state)

      expect(state.cachedState).toEqual(JSON.stringify({
        connections: state.connections,
        items: state.items,
        ports: state.ports,
        groups: state.groups
      }))
    })
  })

  describe('COMMIT_CACHED_STATE', () => {
    describe('when there is a state cached', () => {
      let state: DocumentState

      const cachedState = createSerializedState()

      beforeEach(() => {
        state = {
          ...createState(),
          cachedState,
          redoStack: [
            createSerializedState(),
            createSerializedState()
          ]
        }

        mutations.COMMIT_CACHED_STATE(state)
      })

      it('should push the cached state into the undo stack', () => {
        expect(state.undoStack[state.undoStack.length - 1]).toEqual(cachedState)
      })

      it('should clear the current cached state', () => {
        expect(state.cachedState).toBeNull()
      })

      it('should clear the redo stack', () => {
        expect(state.redoStack).toHaveLength(0)
      })
    })

    it('should not mutate the undo stack if there is no cached state', () => {
      const state = createState()

      mutations.COMMIT_CACHED_STATE(state)

      expect(state.undoStack).toHaveLength(0)
    })
  })

  describe('COMMIT_TO_REDO', () => {
    describe('when there is a state cached', () => {
      let state: DocumentState

      const cachedState = createSerializedState()

      beforeEach(() => {
        state = {
          ...createState(),
          cachedState
        }

        mutations.COMMIT_TO_REDO(state)
      })

      it('should push the cached state into the redo stack', () => {
        expect(state.redoStack[state.redoStack.length - 1]).toEqual(cachedState)
      })

      it('should clear the current cached state', () => {
        expect(state.cachedState).toBeNull()
      })
    })

    it('should not mutate the redo stack if there is no cached state', () => {
      const state = createState()

      mutations.COMMIT_TO_REDO(state)

      expect(state.redoStack).toHaveLength(0)
    })
  })

  describe('COMMIT_TO_UNDO', () => {
    describe('when there is a state cached', () => {
      let state: DocumentState

      const cachedState = createSerializedState()

      beforeEach(() => {
        state = {
          ...createState(),
          cachedState
        }

        mutations.COMMIT_TO_UNDO(state)
      })

      it('should push the cached state into the undo stack', () => {
        expect(state.undoStack[state.undoStack.length - 1]).toEqual(cachedState)
      })

      it('should clear the current cached state', () => {
        expect(state.cachedState).toBeNull()
      })
    })

    it('should not mutate the undo stack if there is no cached state', () => {
      const state = createState()

      mutations.COMMIT_TO_UNDO(state)

      expect(state.undoStack).toHaveLength(0)
    })
  })

  describe('REMOVE_LAST_UNDO_STATE', () => {
    it('should remove the most recent undo state', () => {
      const state = {
        ...createState(),
        undoStack: [createSerializedState()]
      }

      mutations.REMOVE_LAST_UNDO_STATE(state)

      expect(state.undoStack).toHaveLength(0)
    })
  })

  describe('REMOVE_LAST_REDO_STATE', () => {
    it('should remove the most recent undo state', () => {
      const state = {
        ...createState(),
        redoStack: [createSerializedState()]
      }

      mutations.REMOVE_LAST_REDO_STATE(state)

      expect(state.redoStack).toHaveLength(0)
    })
  })

  describe('APPLY_STATE', () => {
    let state: DocumentState

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
      state = {
        ...createState(),
        items: { removedItem1, removedItem2 },
        ports: { removedPort1, removedPort2 },
        connections: { removedConnection }
      }

      jest
        .spyOn(mutations, 'commit')
        .mockImplementation(jest.fn())

      mutations.APPLY_STATE(state, JSON.stringify({
        ...createState(),
        items: { addedItem1, addedItem2, addedIc },
        ports: { addedPort1, addedPort2 },
        connections: { addedConnection }
      }))
    })

    it('should add the items that are not present in the old state but are new one', () => {
      expect(state.items).not.toHaveProperty('removedItem1')
      expect(state.items).not.toHaveProperty('removedItem2')
    })

    it('should remove the items from the old state that are not present in the new one', () => {
      expect(state.items).toHaveProperty('addedItem1')
      expect(state.items).toHaveProperty('addedItem2')
      expect(state.items.addedItem1).toEqual(addedItem1)
      expect(state.items.addedItem2).toEqual(addedItem2)
      expect(state.items.addedIc).toEqual(addedIc)
    })

    it('should commit REMOVE_ELEMENT for each item that will be lost between states', () => {
      expect(mutations.commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'removedItem1')
      expect(mutations.commit).toHaveBeenCalledWith('REMOVE_ELEMENT', 'removedItem2')
    })

    it('should commit DISCONNECT for each connection that will be lost between states', () => {
      expect(mutations.commit).toHaveBeenCalledWith('DISCONNECT', state.connections.removedConnection)
    })

    it('should commit ADD_INTEGRATED_CIRCUIT for each integrated circuit item added', () => {
      expect(mutations.commit).toHaveBeenCalledWith('ADD_INTEGRATED_CIRCUIT', {
        integratedCircuitItem: addedIc,
        integratedCircuitPorts: { addedPort1, addedPort2 }
      })
    })

    it('should commit ADD_ELEMENT for each non-IC item added', () => {
      expect(mutations.commit).toHaveBeenCalledWith('ADD_ELEMENT', {
        item: addedItem1,
        ports: [addedPort1, addedPort2]
      })
      expect(mutations.commit).toHaveBeenCalledWith('ADD_ELEMENT', {
        item: addedItem2,
        ports: [addedPort1, addedPort2]
      })
    })

    it('should commit CONNECT for each connection that will be gained between states', () => {
      expect(mutations.commit).toHaveBeenCalledWith('CONNECT', addedConnection)
    })
  })

  describe('SET_CIRCUIT', () => {
    it('should set the circuit to the one given', () => {
      const circuit = new SimulationService([], [], {})
      const state = createState()

      mutations.SET_CIRCUIT(state, circuit)

      expect(state.simulation).toEqual(circuit)
    })
  })

  describe('SET_WAVE_LIST', () => {
    it('should set the wave list to the one given', () => {
      const waves: WaveList = {
        wave1: new BinaryWaveService('node1')
      }
      const state = createState()

      mutations.SET_WAVE_LIST(state, waves)

      expect(state.waves).toEqual(waves)
    })
  })

  describe('ADD_PORT', () => {
    const port = createPort('port', 'item', PortType.Input)
    const item = createItem('item', ItemType.Buffer)
    const state = {
      ...createState(),
      items: { item }
    }

    beforeEach(() => {
      mutations.ADD_PORT(state, port)
    })

    it('should set the port onto the state', () => {
      expect(state.ports).toHaveProperty('port')
      expect(state.ports.port).toEqual(port)
    })

    it('should add the ID of the port to the port IDs list of the element it references', () => {
      expect(state.items.item.portIds).toContain('port')
    })
  })

  describe('REMOVE_PORT', () => {
    let state: DocumentState

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
      state = {
        ...createState(),
        items: { item1, item2, freeportItem },
        ports: { inputPort, outputPort, startPort, endPort },
        connections: { connectionPart1, connectionPart2 }
      }

      jest
        .spyOn(state.simulation, 'removeConnection')
        .mockImplementation(jest.fn())
    })

    function assertRemovePort (description: string, portId: string) {
      describe(description, () => {
        beforeEach(() => {
          mutations.REMOVE_PORT(state, portId)
        })

        it('should remove the connections from the entire connection chain', () => {
          expect(state.connections).not.toHaveProperty('connectionPart1')
          expect(state.connections).not.toHaveProperty('connectionPart2')
        })

        it('should remove the connections from the circuit', () => {
          expect(state.simulation.removeConnection).toHaveBeenCalledTimes(2)
          expect(state.simulation.removeConnection).toHaveBeenCalledWith('startPort', 'inputPort')
          expect(state.simulation.removeConnection).toHaveBeenCalledWith('outputPort', 'endPort')
        })

        it('should remove the freeport item in the connection chain', () => {
          expect(state.items).not.toHaveProperty('freeportItem')
        })

        it('should remove all ports associated with the connection chain', () => {
          expect(state.ports).not.toHaveProperty('inputPort')
          expect(state.ports).not.toHaveProperty('outputPort')
        })
      })
    }

    assertRemovePort('when the start port of the chain is being removed', 'startPort')
    assertRemovePort('when the end port of the chain is being removed', 'endPort')
    assertRemovePort('when the input port of the freeport item in the chain is being removed', 'inputPort')
    assertRemovePort('when the output port of the freeport item in the chain is being removed', 'outputPort')
  })

  describe('SET_PORT_VALUES', () => {
    let state: DocumentState
    let port1: Port
    let port2: Port
    let port3: Port

    beforeEach(() => {
      port1 = createPort('port1', 'item1', PortType.Input, { value: 0 })
      port2 = createPort('port2', 'item1', PortType.Output, { value: -1 })
      port3 = createPort('port3', 'item1', PortType.Output, { value: -1 })
    })

    it('should set the values of each port changed in the value map', () => {
      state = {
        ...createState(),
        ports: { port1, port2, port3 }
      }

      mutations.SET_PORT_VALUES(state, { port1: 1, port2: 1 })

      expect(state.ports.port1.value).toEqual(1)
      expect(state.ports.port2.value).toEqual(1)
    })

    it('should not change the value of a port not present in the value map', () => {
      state = {
        ...createState(),
        ports: { port1, port2, port3 }
      }

      mutations.SET_PORT_VALUES(state, { port1: 1, port2: 1 })

      expect(state.ports.port3.value).toEqual(-1)
    })

    it('should not break if a port that does not exist is present in the map', () => {
      state = {
        ...createState(),
        ports: { port1, port2, port3 }
      }

      expect.assertions(3)

      mutations.SET_PORT_VALUES(state, { someNonExistingPort: 1 })

      expect(state.ports.port1.value).toEqual(0)
      expect(state.ports.port2.value).toEqual(-1)
      expect(state.ports.port3.value).toEqual(-1)
    })
  })

  describe('SET_PORT_VALUE', () => {
    it('should set given the port value for the given node id', () => {
      const state = createState()
      const id = 'node1'
      const value = 1

      jest
        .spyOn(state.simulation, 'setPortValue')
        .mockImplementation(jest.fn())

      mutations.SET_PORT_VALUE(state, { id, value })

      expect(state.simulation.setPortValue).toHaveBeenCalledTimes(1)
      expect(state.simulation.setPortValue).toHaveBeenCalledWith(id, value)
    })
  })

  describe('ADD_ELEMENT', () => {
    let state: DocumentState

    const item = createItem('item', ItemType.InputNode)
    const port = createPort('port', 'item1', PortType.Output)

    beforeEach(() => {
      state = createState()

      jest
        .spyOn(state.simulation, 'addNode')
        .mockImplementation(jest.fn())

      mutations.ADD_ELEMENT(state, { item, ports: [port] })
    })

    it('should add the ports to the state', () => {
      expect(state.ports).toHaveProperty('port')
      expect(state.ports.port).toEqual(port)
    })

    it('should add the item to the state', () => {
      expect(state.items).toHaveProperty('item')
      expect(state.items.item).toEqual(item)
    })

    it('should add the item as a node to the circuit', () => {
      expect(state.simulation.addNode).toHaveBeenCalledTimes(1)
      expect(state.simulation.addNode).toHaveBeenCalledWith(item, state.ports)
    })
  })

  describe('ADD_INTEGRATED_CIRCUIT', () => {
    it('should not mutate the state if the item is not an integrated circuit', () => {
      const item1 = createItem('item1', ItemType.LogicGate)
      const state = {
        ...createState(),
        items: { item1 }
      }

      mutations.ADD_INTEGRATED_CIRCUIT(state, {
        integratedCircuitItem: item1,
        integratedCircuitPorts: {}
      })

      expect(state).not.toHaveProperty('item1')
    })

    describe('when the item is an integrated circuit', () => {
      let state: DocumentState

      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const icItem = createItem('icItem', ItemType.IntegratedCircuit, {
        integratedCircuit: {
          items: {},
          ports: { port1, port2 },
          connections: {}
        }
      })

      beforeEach(() => {
        state = createState()

        jest
          .spyOn(state.simulation, 'addIntegratedCircuit')
          .mockImplementation(jest.fn())

        mutations.ADD_INTEGRATED_CIRCUIT(state, {
          integratedCircuitItem: icItem,
          integratedCircuitPorts: { port1, port2 }
        })
      })

      it('should add each port to the state', () => {
        expect(state.ports).toHaveProperty('port1')
        expect(state.ports).toHaveProperty('port2')
        expect(state.ports.port1).toEqual(port1)
        expect(state.ports.port2).toEqual(port2)
      })

      it('should add the integrated circuit item to the state', () => {
        expect(state.items).toHaveProperty('icItem')
        expect(state.items.icItem).toEqual(icItem)
      })

      it('should install the integrated circuit onto the active circuit', () => {
        expect(state.simulation.addIntegratedCircuit).toHaveBeenCalledTimes(1)
        expect(state.simulation.addIntegratedCircuit).toHaveBeenCalledWith(icItem, { port1, port2 })
      })
    })
  })

  describe('REMOVE_ELEMENT', () => {
    let state: DocumentState

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
        state = {
          ...createState(),
          items: { icItem },
          ports: { port1, port2, port3 }
        }

        jest
          .spyOn(state.simulation, 'removeNode')
          .mockImplementation(jest.fn())

        mutations.REMOVE_ELEMENT(state, 'icItem')
      })

      it('should remove each port associated to the IC', () => {
        expect(state.ports).not.toHaveProperty('port1')
        expect(state.ports).not.toHaveProperty('port2')
      })

      it('should remove each embedded IC item from the circuit', () => {
        expect(state.simulation.removeNode).toHaveBeenCalledTimes(2)
        expect(state.simulation.removeNode).toHaveBeenCalledWith(['node1port'])
        expect(state.simulation.removeNode).toHaveBeenCalledWith(['node2port'])
      })

      it('should not remove ports that are not associated to the IC', () => {
        expect(state.ports).toHaveProperty('port3')
        expect(state.ports.port3).toEqual(port3)
      })

      it('should remove the IC item', () => {
        expect(state.items).not.toHaveProperty('icItem')
      })
    })

    describe('when the item is regular, non-IC element', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { portIds: ['port1', 'port2'] })
      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const port3 = createPort('port3', 'otherItem', PortType.Output)

      beforeEach(() => {
        state = {
          ...createState(),
          items: { item1 },
          ports: { port1, port2, port3 }
        }

        jest
          .spyOn(state.simulation, 'removeNode')
          .mockImplementation(jest.fn())

        mutations.REMOVE_ELEMENT(state, 'item1')
      })

      it('should remove each port associated to the IC', () => {
        expect(state.ports).not.toHaveProperty('port1')
        expect(state.ports).not.toHaveProperty('port2')
      })

      it('should remove the node from the circuit', () => {
        expect(state.simulation.removeNode).toHaveBeenCalledTimes(1)
        expect(state.simulation.removeNode).toHaveBeenCalledWith(['port1', 'port2'])
      })

      it('should not remove ports that are not associated to the item', () => {
        expect(state.ports).toHaveProperty('port3')
        expect(state.ports.port3).toEqual(port3)
      })

      it('should remove the item', () => {
        expect(state.items).not.toHaveProperty('icItem')
      })
    })
  })

  describe('ADD_TO_OSCILLOSCOPE', () => {
    const item1 = createItem('item1', ItemType.OutputNode, { portIds: ['item1port1', 'item2port2'] })
    const item2 = createItem('item2', ItemType.InputNode, { portIds: ['item2port1', 'item2port2'] })
    const item1port1 = createPort('item1port1', 'item1', PortType.Input)
    const item1port2 = createPort('item1port2', 'item1', PortType.Output)
    const item2port1 = createPort('item2port1', 'item2', PortType.Input)
    const item2port2 = createPort('item2port2', 'item2', PortType.Output)
    const state = {
      ...createState(),
      items: { item1, item2 },
      ports: { item1port1, item1port2, item2port1, item2port2 }
    }

    beforeEach(() => {
      jest
        .spyOn(state.simulation, 'monitorPort')
        .mockImplementation(jest.fn())
    })

    it('should monitor its input ports when the item is an output node', () => {
      mutations.ADD_TO_OSCILLOSCOPE(state, 'item1')

      expect(state.simulation.monitorPort).toHaveBeenCalledTimes(1)
      expect(state.simulation.monitorPort).toHaveBeenCalledWith('item1port1', item1port1.value)
    })

    it('should monitor its output ports when the item is an input node', () => {
      mutations.ADD_TO_OSCILLOSCOPE(state, 'item2')

      expect(state.simulation.monitorPort).toHaveBeenCalledTimes(1)
      expect(state.simulation.monitorPort).toHaveBeenCalledWith('item2port2', item2port2.value)
    })
  })

  describe('REMOVE_FROM_OSCILLOSCOPE', () => {
    const item1 = createItem('item1', ItemType.OutputNode, { portIds: ['port1', 'port2'] })
    const port1 = createPort('port1', 'item1', PortType.Input)
    const port2 = createPort('port2', 'item1', PortType.Output)
    const state = {
      ...createState(),
      items: { item1 },
      ports: { port1, port2 }
    }

    it('should unmonitor for each port in the given item', () => {
      jest
        .spyOn(state.simulation, 'unmonitorPort')
        .mockImplementation(jest.fn())

      mutations.REMOVE_FROM_OSCILLOSCOPE(state, 'item1')

      expect(state.simulation.unmonitorPort).toHaveBeenCalledTimes(2)
      expect(state.simulation.unmonitorPort).toHaveBeenCalledWith('port1')
      expect(state.simulation.unmonitorPort).toHaveBeenCalledWith('port2')
    })
  })

  describe('SET_ITEM_PROPERTY', () => {
    it('should set the property to the given value', () => {
      const propertyName = 'gateType'
      const value = 'OR'
      const id = 'item-id'
      const state = {
        ...createState(),
        items: {
          [id]: createItem(id, ItemType.LogicGate, {
            properties: {
              [propertyName]: {
                type: 'string',
                value: 'AND',
                label: 'Gate Type'
              }
            }
          })
        }
      }

      mutations.SET_ITEM_PROPERTY(state, { id, propertyName, value })

      expect(state.items[id].properties[propertyName].value).toEqual(value)
    })
  })

  describe('SET_ELEMENT_SIZE', () => {
    it('should set the width and height of the item to the values provided', () => {
      const id = 'item-id'
      const item = createItem(id, ItemType.Buffer)
      const state = {
        ...createState(),
        items: {
          [id]: item
        }
      }
      const width = 100
      const height = 250

      mutations.SET_ELEMENT_SIZE(state, { id, rect: { width, height } })

      expect(state.items[id].width).toEqual(width)
      expect(state.items[id].height).toEqual(height)
    })
  })

  describe('SELECT_ALL', () => {
    let state: DocumentState

    const item1 = createItem('item1', ItemType.Buffer)
    const item2 = createItem('item2', ItemType.Buffer)
    const connection1 = createConnection('connection1', 'port1', 'port2')
    const connection2 = createConnection('connection2', 'port3', 'port4')

    beforeEach(() => {
      state = {
        ...createState(),
        items: { item1, item2 },
        connections: { connection1, connection2 }
      }

      mutations.SELECT_ALL(state)
    })

    it('should set isSelected to true for all connections', () => {
      expect(state.connections.connection1.isSelected).toBe(true)
      expect(state.connections.connection2.isSelected).toBe(true)
    })

    it('should set isSelected to true for all items', () => {
      expect(state.items.item2.isSelected).toBe(true)
      expect(state.items.item2.isSelected).toBe(true)
    })

    it('should populate selectedItemIds to have exactly all item ids selected', () => {
      expect(state.selectedItemIds).toHaveLength(2)
      expect(state.selectedItemIds).toContain('item1')
      expect(state.selectedItemIds).toContain('item2')
    })

    it('should populate selectedConnectionIds to have exactly all connection ids selected', () => {
      expect(state.selectedConnectionIds).toHaveLength(2)
      expect(state.selectedConnectionIds).toContain('connection1')
      expect(state.selectedConnectionIds).toContain('connection2')
    })
  })

  describe('DESELECT_ALL', () => {
    let state: DocumentState

    const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })
    const item2 = createItem('item2', ItemType.Buffer, { isSelected: true })
    const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true })
    const connection2 = createConnection('connection2', 'port3', 'port4', { isSelected: true })

    beforeEach(() => {
      state = {
        ...createState(),
        items: { item1, item2 },
        connections: { connection1, connection2 }
      }

      mutations.DESELECT_ALL(state)
    })

    it('should set isSelected to false for all connections', () => {
      expect(state.connections.connection1.isSelected).toBe(false)
      expect(state.connections.connection2.isSelected).toBe(false)
    })

    it('should set isSelected to false for all items', () => {
      expect(state.items.item2.isSelected).toBe(false)
      expect(state.items.item2.isSelected).toBe(false)
    })

    it('should empty the lists of selected connection and item ids', () => {
      expect(state.selectedItemIds).toHaveLength(0)
      expect(state.selectedConnectionIds).toHaveLength(0)
    })
  })

  describe('SET_SELECTION_STATE', () => {
    let state: DocumentState

    it('should select the item', () => {
      const item1 = createItem('item1', ItemType.Buffer)
      const state = {
        ...createState(),
        items: { item1 }
      }

      mutations.SET_SELECTION_STATE(state, { id: 'item1', isSelected: true })

      expect(state.items.item1.isSelected).toBe(true)
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

      beforeEach(() => {
        state = {
          ...createState(),
          items: { item1, item2, freeportItem },
          ports: { inputPort, outputPort, startPort, endPort },
          connections: { connectionPart1, connectionPart2 }
        }

        mutations.SET_SELECTION_STATE(state, { id: 'connectionPart1', isSelected: true })
      })

      it('should select all connections that are part of the connection chain', () => {
        expect(state.connections.connectionPart1.isSelected).toBe(true)
        expect(state.connections.connectionPart2.isSelected).toBe(true)
      })

      it('should select all freeports associated to the chain', () => {
        expect(state.items.freeportItem.isSelected).toBe(true)
      })
    })

    it('should select nothing if the element does not exist', () => {
      const item1 = createItem('item1', ItemType.Buffer)
      const state = {
        ...createState(),
        items: { item1 }
      }

      mutations.SET_SELECTION_STATE(state, { id: 'someNonExistingElement', isSelected: true })

      expect(state.items.item1.isSelected).not.toBe(true)
    })
  })

  describe('CONNECT', () => {
    let state: DocumentState

    const source = 'source-id'
    const target = 'target-id'

    beforeEach(() => {
      state = {
        ...createState(),
        ports: {
          [source]: createPort(source, 'item1', PortType.Output),
          [target]: createPort(target, 'item2', PortType.Input)
        }
      }

      jest
        .spyOn(state.simulation, 'addConnection')
        .mockImplementation(jest.fn())
    })

    it('should not add any new connections if the source is not specified', () => {
      mutations.CONNECT(state, { target })

      const connections = Object.keys(state.connections)

      expect(connections).toHaveLength(0)
      expect(state.simulation.addConnection).not.toHaveBeenCalled()
    })

    it('should not add any new connections if the target is not specified', () => {
      mutations.CONNECT(state, { source })

      const connections = Object.keys(state.connections)

      expect(connections).toHaveLength(0)
      expect(state.simulation.addConnection).not.toHaveBeenCalled()
    })

    it('should add the connection to the state if both the source and target are specified', () => {
      mutations.CONNECT(state, { source, target })

      const connections = Object.keys(state.connections)

      expect(connections).toHaveLength(1)
      expect(state.connections[connections[0]]).toEqual({
        id: expect.any(String),
        source,
        target,
        connectionChainId: expect.any(String),
        groupId: null,
        zIndex: 2,
        isSelected: false
      })
      expect(state.simulation.addConnection).toHaveBeenCalledTimes(1)
      expect(state.simulation.addConnection).toHaveBeenCalledWith(source, target)
    })

    it('should add the connected port ids to each port\'s list', () => {
      mutations.CONNECT(state, { source, target })

      expect(state.ports[source].connectedPortIds).toEqual([target])
      expect(state.ports[target].connectedPortIds).toEqual([source])
    })

    it('should add the connection to the specified chain if its ID is provided', () => {
      const connectionChainId = 'connection-chain-id'

      mutations.CONNECT(state, { source, target, connectionChainId })

      const connections = Object.keys(state.connections)

      expect(connections).toHaveLength(1)
      expect(state.connections[connections[0]]).toEqual({
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

  describe('DISCONNECT', () => {
    let state: DocumentState

    const source = 'source-id'
    const target = 'target-id'
    const connection = createConnection('connection', source, target)

    beforeEach(() => {
      state = {
        ...createState(),
        connections: { connection },
        ports: {
          [source]: createPort(source, 'item1', PortType.Output),
          [target]: createPort(target, 'item2', PortType.Input)
        }
      }

      jest
        .spyOn(state.simulation, 'removeConnection')
        .mockImplementation(jest.fn())
    })

    it('should not remove the connection if the source was not found', () => {
      mutations.DISCONNECT(state, { source: 'invalid-id', target })

      expect(state.connections).toHaveProperty('connection')
      expect(state.connections.connection).toEqual(connection)
    })

    it('should not remove the connection if the target was not found', () => {
      mutations.DISCONNECT(state, { source, target: 'invalid-id' })

      expect(state.connections).toHaveProperty('connection')
      expect(state.connections.connection).toEqual(connection)
    })

    it('should remove the connection from the state and the circuit', () => {
      mutations.DISCONNECT(state, { source, target })

      expect(state.connections).not.toHaveProperty('connection')
      expect(state.simulation.removeConnection).toHaveBeenCalledTimes(1)
      expect(state.simulation.removeConnection).toHaveBeenCalledWith(source, target)
    })
  })

  describe('GROUP_ITEMS', () => {
    let state: DocumentState
    let item1: Item
    let item2: Item
    let connection1: Connection
    let connection2: Connection
    let group: Group

    beforeEach(() => {
      item1 = createItem('item1', ItemType.Buffer)
      item2 = createItem('item2', ItemType.Buffer)
      connection1 = createConnection('connection1', 'port1', 'port2')
      connection2 = createConnection('connection2', 'port3', 'port4')
      group = createGroup('group', ['item1', 'item2'], {
        connectionIds: ['connection1', 'connection2']
      })

      state = {
        ...createState(),
        items: { item1, item2 },
        connections: { connection1, connection2 }
      }

      mutations.GROUP_ITEMS(state, group)
    })

    it('should add the group to the state', () => {
      expect(state.groups).toHaveProperty('group')
      expect(state.groups.group).toEqual(group)
    })

    it('should set all groupIds of all items specified in the group to its ID', () => {
      expect(state.items.item1.groupId).toEqual(group.id)
      expect(state.items.item2.groupId).toEqual(group.id)
    })

    it('should set all groupIds of all connections specified in the group to its ID', () => {
      expect(state.connections.connection1.groupId).toEqual(group.id)
      expect(state.connections.connection2.groupId).toEqual(group.id)
    })
  })

  describe('UNGROUP', () => {
    let state: DocumentState
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

      state = {
        ...createState(),
        items: { item1, item2 },
        connections: { connection1, connection2 },
        groups: { [groupId]: group }
      }

      mutations.UNGROUP(state, groupId)
    })

    it('should remove the group from the state', () => {
      expect(state.groups).not.toHaveProperty(groupId)
    })

    it('should set all groupIds of all items specified in the group to null', () => {
      expect(state.items.item1.groupId).toBeNull()
      expect(state.items.item2.groupId).toBeNull()
    })

    it('should set all groupIds of all connections specified in the group to null', () => {
      expect(state.connections.connection1.groupId).toBeNull()
      expect(state.connections.connection2.groupId).toBeNull()
    })
  })

  describe('CREATE_FREEPORT_ELEMENT', () => {
    let state: DocumentState
    const itemId = 'item-id'
    const inputPortId = 'input-port-id'
    const outputPortId = 'output-port-id'
    const value = 1
    const position: Point = {
      x: 10,
      y: 25
    }

    beforeEach(() => {
      state = {
        ...createState(),
        items: {
          [itemId]: createItem(itemId, ItemType.InputNode)
        }
      }

      jest
        .spyOn(state.simulation, 'addNode')
        .mockImplementation(jest.fn())
    })

    it('should add an input port if its ID is defined', () => {
      mutations.CREATE_FREEPORT_ELEMENT(state, { itemId, inputPortId, position })

      expect(state.ports).toHaveProperty(inputPortId)
      expect(state.ports[inputPortId]).toEqual({
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
      mutations.CREATE_FREEPORT_ELEMENT(state, { itemId, outputPortId, position })

      expect(state.ports).toHaveProperty(outputPortId)
      expect(state.ports[outputPortId]).toEqual({
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
      mutations.CREATE_FREEPORT_ELEMENT(state, { itemId, inputPortId, outputPortId, position, value })

      expect(state.items).toHaveProperty(itemId)
      expect(state.items[itemId]).toEqual({
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
        isSelected: true,
        groupId: null,
        zIndex: 2,
        width: 1,
        height: 1
      })
    })

    it('should add the freeport to the circuit with its evaluation forced', () => {
      mutations.CREATE_FREEPORT_ELEMENT(state, { itemId, inputPortId, outputPortId, position, value })

      expect(state.simulation.addNode).toHaveBeenCalledTimes(1)
      expect(state.simulation.addNode).toHaveBeenCalledWith(state.items[itemId], state.ports, true)
    })
  })

  describe('ROTATE_ELEMENT', () => {
    const id = 'item-id'
    const port1 = createPort('port1', id, PortType.Input)
    const port2 = createPort('port2', id, PortType.Input)
    const item = createItem(id, ItemType.Buffer, { portIds: ['port1', 'port2'] })
    const rotation = 2
    const state = {
      ...createState(),
      items: { [id]: item },
      ports: { port1, port2 }
    }

    beforeEach(() => {
      mutations.ROTATE_ELEMENT(state, { id, rotation })
    })

    it('should apply the given rotation to the given item', () => {
      expect(state.items[id].rotation).toEqual(rotation)
    })

    it('should apply the given rotation to all ports in the given item', () => {
      expect(state.ports.port1.rotation).toEqual(rotation)
      expect(state.ports.port2.rotation).toEqual(rotation)
    })
  })
})
