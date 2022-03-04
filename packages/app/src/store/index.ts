import { createStore, GetterTree, MutationTree } from 'vuex'
import sample from './sample2'
// import sample from './test.json'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import CircuitService from '@/services/CircuitService'
import actions from './actions'
import DocumentState from './DocumentState'
import getConnectionChain from '@/utils/getConnectionChain'
import createIntegratedCircuit from '@/utils/createIntegratedCircuit'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

const state: DocumentState = {
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
  groups: {}, // TODO: remove
  zoomLevel: 1,
  ...sample
}

const getters: GetterTree<DocumentState, DocumentState> = {
  zoom (state) {
    return state.zoomLevel
  },

  ports (state) {
    return state.ports
  },

  items (state) {
    return Object
      .keys(state.items)
      .map((itemId: string) => ({
        ...state.items[itemId],
        id: itemId,
        ports: state
          .items[itemId]
          .portIds
          .map((portId: string) => state.ports[portId])
      }))
  },

  connections (state) {
    const { ports } = state

    return Object
      .values(state.connections)
      .map(wire => ({
        ...wire,
        source: ports[wire.source],
        target: ports[wire.target]
      }))
      .filter(({ source, target }) => source && target)
  },

  selectedItemsData (state) {
    return Object
      .values(state.items)
      .reduce((selection, item: Item) => {
        if (!item.isSelected) return selection

        return {
          type: selection.type && selection.type !== item.type
            ? 'Mixed'
            : item.type,
          count: selection.count + 1
        }
      }, { type: '', count: 0 })
  },

  selectedConnectionsCount (state) {
    return Object
      .values(state.connections)
      .filter(({ isSelected }) => isSelected)
      .length
  },

  selectedGroupsCount (state) {
    return Object
      .values(state.connections)
      .filter(({ isSelected }) => isSelected)
      .length
  },

  nextZIndex (state) {
    return Object.keys(state.items).length + Object.keys(state.connections).length
  },

  canUndo (state) {
    return state.undoStack.length > 0
  },

  canRedo (state) {
    return state.redoStack.length > 0
  }
}


const mutations: MutationTree<DocumentState> = {
  'SET_IC_CIRCUIT' (state) {
    const circuit = createIntegratedCircuit(state)

    state.items = circuit.items
    state.connections = circuit.connections
    state.ports = circuit.ports
  },

  'ADD_CIRCUIT_NODE' (state, itemId: string) {
    state
      .circuit
      .addNode(state.items[itemId], state.ports, true)
  },

  'REMOVE_CIRCUIT_NODE' (state, itemId: string) {
    state
      .circuit
      .removeNode(state.items[itemId].portIds)
  },

  'CACHE_STATE' (state) {
    state.cachedState = JSON.stringify({
      connections: state.connections,
      items: state.items,
      ports: state.ports,
      groups: state.groups
    })
  },

  'COMMIT_CACHED_STATE' (state) {
    if (state.cachedState) {
      state.undoStack.push(state.cachedState.toString())
      state.cachedState = null

      while (state.redoStack.length > 0) {
        state.redoStack.pop()
      }
    }
  },

  'COMMIT_TO_REDO' (state) {
    if (state.cachedState) {
      state.redoStack.push(state.cachedState)
      state.cachedState = null
    }
  },

  'COMMIT_TO_UNDO' (state) {
    if (state.cachedState) {
      state.undoStack.push(state.cachedState)
      state.cachedState = null
    }
  },

  'REMOVE_LAST_UNDO_STATE' (state) {
    state.undoStack.pop()
  },

  'REMOVE_LAST_REDO_STATE' (state) {
    state.redoStack.pop()
  },

  'APPLY_STATE' (state, savedState: string) {
    // console.log('APPLYING: ', JSON.stringify(JSON.parse(savedState), null, 2))
    const { items, connections, ports, groups } = JSON.parse(savedState) as {
      items: { [id: string]: Item },
      connections: { [id: string]: Connection },
      ports: { [id: string]: Port },
      groups: { [id: string]: Group },
    }

    /* returns everything in a not in b */
    function getExcludedMembers (a: { [id: string]: BaseItem }, b: { [id: string]: BaseItem }) {
      const aIds = Object.keys(a)
      const bIds = Object.keys(b)

      return aIds.filter(id => !bIds.includes(id))
    }

    // find all items and connections in current state that are not in undo state and remove them from the circuit
    const removedItems = getExcludedMembers(state.items, items)
    const removedConnections = getExcludedMembers(state.connections, connections)

    // add any new items from the undone state to the circuit
    const addedItems = getExcludedMembers(items, state.items)
    const addedConnections = getExcludedMembers(connections, state.connections)

    state.circuit.pause() // pause the circuit to prevent interruption

    removedConnections.forEach(id => {
      const connection = state.connections[id]

      state.circuit.removeConnection(connection.source, connection.target)
    })
    removedItems.forEach(id => {
      state.circuit.removeNode(state.items[id].portIds)
    })

    state.ports = ports
    state.items = items
    state.connections = connections
    state.groups = groups

    addedItems.forEach(id => {
      state.circuit.addNode(items[id], ports)
      state.items[id].isSelected = true
    })
    addedConnections.forEach(id => {
      const connection = connections[id]

      state.connections[id].isSelected = true
      state.circuit.addConnection(connection.source, connection.target)
    })

    // continue the circuit simulation
    state.circuit.unpause()
  },

  'SET_CIRCUIT' (state, circuit: CircuitService) {
    state.circuit = circuit
  },

  'SET_WAVE_LIST' (state, waves: WaveList) {
    state.waves = waves
  },

  'ADD_PORT' (state, port) {
    state.ports[port.id] = port
    state.items[port.elementId].portIds.push(port.id)
  },

  'REMOVE_PORT' (state, portId: string) {
    // remove all connections associated with this port
    Object
      .values(state.connections)
      .filter(({ target }) => target === portId)
      .forEach(c => {
        // find all segments and freeports of this connection and remove them
        const {
          connectionIds,
          freeportIds
        } = getConnectionChain(Object.values(state.connections), state.ports, c.connectionChainId)

        connectionIds.forEach(id => {
          // delete all connections associated with the chain
          const { source, target } = state.connections[id]

          state
            .circuit
            .removeConnection(source, target)

          delete state.connections[id]
        })

        freeportIds.forEach(id => {
          // delete all freeports associated with the chain
          state.items[id].portIds.forEach(portId => {
            delete state.ports[portId]
          })
          delete state.items[id]
        })
      })

    const port = state.ports[portId]
    const item = state.items[port.elementId]

    // remove the reference to the port from the element
    const portIndex = item.portIds.findIndex(i => i === portId)

    if (portIndex !== -1) {
      state.items[item.id].portIds.splice(portIndex, 1)
    }

    delete state.ports[portId]
  },

  'SET_PORT_VALUES' (state, valueMap) {
    for (const portId in valueMap) {
      if (state.ports[portId]) {
        state.ports[portId].value = valueMap[portId]
      }
    }
  },

  'SET_PORT_VALUE' (state, { id, value }: { id: string, value: number }) {
    state
      .circuit
      .setPortValue(id, value)
  },

  'ADD_ELEMENT' (state, { item, ports }: { item: Item, ports: Port[] }) {
    state.items[item.id] = item

    ports.forEach(port => {
      state.ports[port.id] = port
    })

    state
      .circuit
      .addNode(item, state.ports)
  },

  'REMOVE_ELEMENT' (state, id: string) {
    state.items[id].portIds.forEach(portId => {
      delete state.ports[portId]
    })
    delete state.items[id]
  },

  'ADD_TO_OSCILLOSCOPE' (state, id: string) {
    const item = state.items[id]
    const portType = item.type === 'OutputNode'
      ? PortType.Input // output elements (lightbulb, etc.) will monitor incoming port values
      : PortType.Output // all other elements will monitor the outgoing port values

      console.log('WILL MONITOR: ', item.type)
    item
      .portIds
      .forEach(portId => {
        const port = state.ports[portId]

        if (port.type === portType) {
          console.log('MONITOR: ', portId)
          state
            .circuit
            .monitorPort(portId, port.value)
        }
      })
  },

  'REMOVE_FROM_OSCILLOSCOPE' (state, id: string) {
    const item = state.items[id]

    item
      .portIds
      .forEach(portId => {
        state
          .circuit
          .unmonitorPort(portId)
      })
  },

  'SET_ITEM_PROPERTY' (state, { id, propertyName, value }: { id: string, propertyName: string, value: any }) {
    (state.items[id].properties as PropertySet)[propertyName].value = value
  },

  'SET_ELEMENT_SIZE' (state, { rect, id }: { rect: DOMRectReadOnly, id: string }) {
    state.items[id].width = rect.width
    state.items[id].height = rect.height
  },

  'SET_SNAP_BOUNDARIES' (state, snapBoundaries: BoundingBox[]) {
    state.snapBoundaries = snapBoundaries
  },

  'SET_PORT_POSITION' (state, { id, position }: { id: string, position: Point }) {
    state.ports[id].position = position
  },

  'SET_ELEMENT_POSITION' (state, { id, position }: { id: string, position: Point }) {
    state.items[id].position = position
  },

  'SET_ELEMENT_BOUNDING_BOX' (state, { boundingBox, id }: { boundingBox: BoundingBox, id: string }) {
    state.items[id].boundingBox = boundingBox
  },

  'SET_GROUP_BOUNDING_BOX' (state, { boundingBox, id }: { boundingBox: BoundingBox, id: string }) {
    state.groups[id].boundingBox = boundingBox
  },

  'SET_ALL_SELECTION_STATES' (state, isSelected: boolean) {
    for (let id in state.connections) {
      state.connections[id].isSelected = isSelected
    }

    for (let id in state.items) {
      state.items[id].isSelected = isSelected
    }

    for (let id in state.groups) {
      state.groups[id].isSelected = isSelected
    }
  },

  'SET_SELECTION_STATE' (state, { id, isSelected }: { id: string, isSelected: boolean }) {
    if (state.items[id]) {
      // select an individual item
      state.items[id].isSelected = isSelected
    } else if (state.connections[id]) {
      const { connectionChainId } = state.connections[id]
      const {
        connectionIds,
        freeportIds
      } = getConnectionChain(Object.values(state.connections), state.ports, connectionChainId)

      // select all connection segments that are part of this connection chain
      connectionIds.forEach(id => {
        state.connections[id].isSelected = isSelected
      })

      // select all freeports that are part of this connection chain
      freeportIds.forEach(id => {
        state.items[id].isSelected = isSelected
      })
    } else if (state.groups[id]) {
      // select a group
      state.groups[id].isSelected = isSelected
    }
  },

  'SET_Z_INDEX' (state, { item, zIndex }: { item: BaseItem, zIndex: number }) {
    const items: BaseItem[] = Object.values(state.items)
    const connections: BaseItem[] = Object.values(state.connections)
    let index = 0

    items
      .concat(connections)
      .sort((a, b) => {
        // sort all connections and items by their zIndexes
        if (a.zIndex > b.zIndex) return -1
        else if (a.zIndex < b.zIndex) return 1
        return 0
      })
      .forEach(i => {
        const type = i.hasOwnProperty('type') ? 'items' : 'connections'

        index++

        if (item.id === i.id) {
          state[type][i.id].zIndex = zIndex
          index++
        } else {
          state[type][i.id].zIndex = index
        }
      })
  },

  'SET_ZOOM' (state, zoom) {
    state.zoomLevel = zoom
  },

  'SET_CONNECTABLE_PORT_IDS' (state, connectablePortIds: string[]) {
    state.connectablePortIds = connectablePortIds
  },

  'CONNECT' (state, { source, target, connectionChainId }: { source: string, target: string, connectionChainId?: string }) {
    const id = `conn_${rand()}`

    if (source && target) {
      state.connections[id] = {
        id,
        source,
        target,
        connectionChainId: connectionChainId || id,
        groupId: null,
        zIndex: 0, // TODO
        isSelected: false
      }

      if (state.ports[target].type === PortType.Input) {
        // if the target is an input, check to make sure it has no incoming connections already
        const connection = Object
          .values(state.connections)
          .find(c => c.target === target)

        if (!connection) {
          // if there is no connection, then add it to the circuit
          state
            .circuit
            .addConnection(source, target)
        }
      }
    }
  },

  'DISCONNECT' (state, { source, target }: { source: string, target: string }) {
    const connection = Object
      .values(state.connections)
      .find(c => c.source === source && c.target === target)

    if (connection) {
      state
        .circuit
        .removeConnection(source, target)

      delete state.connections[connection.id]
    }
  },

  'GROUP_ITEMS' (state, group) {
    state.groups[group.id] = group

    // set the groupId of all items in the group
    group.itemIds.forEach(id => {
      state.items[id].groupId = group.id
    })

    // set the groupId of all connections in the group
    group.connectionIds.forEach(id => {
      state.connections[id].groupId = group.id
    })
  },

  'UNGROUP' (state, groupId: string) {
    const group = state.groups[groupId]

    // remove the groupId of all items in the group and select them
    group.itemIds.forEach(id => {
      state.items[id].groupId = null
      state.items[id].isSelected = true
    })

    // remove the groupId of all connections in the group and select them
    group.connectionIds.forEach(id => {
      state.connections[id].groupId = null
      state.connections[id].isSelected = true
    })

    delete state.groups[groupId]
  },

  'CREATE_FREEPORT_ELEMENT' (
    state,
    { itemId, inputPortId, outputPortId, position, value }:
    { itemId: string, position: Point, outputPortId?: string, inputPortId?: string,
      value?: number }
  ) {

    const createPort = (id: string, type: PortType, orientation: Direction) => ({
      id,
      type,
      elementId: itemId,
      orientation,
      isFreeport: true,
      position: {
        x: 0,
        y: 0
      },
      rotation: 0,
      value: value || 0
    })
    const portIds: string[] = []

    if (inputPortId) {
      state.ports[inputPortId] = createPort(inputPortId, 1, 2) // TODO: pass orientation
      portIds.push(inputPortId)
    }

    if (outputPortId) {
      state.ports[outputPortId] = createPort(outputPortId, 0, 0)
      portIds.push(outputPortId)
    }

    state.items[itemId] = {
      id: itemId,
      type: 'Freeport',
      portIds,
      position,
      rotation: 0,
      boundingBox: {
        left: position.x,
        top: position.y,
        right: position.x,
        bottom: position.y
      },
      isSelected: true,
      groupId: null,
      zIndex: 3,
      width: 1,
      height: 1
    }
  },

  'ROTATE_ELEMENT' (state, { id, rotation }) {
    state.items[id].rotation = rotation

    state
      .items[id]
      .portIds
      .forEach(portId => {
        state.ports[portId].rotation = rotation
      })
  },

  'SET_ACTIVE_FREEPORT_ID' (state, activeFreeportId: string) {
    state.activeFreeportId = activeFreeportId
  }
}

export default createStore({
  state,
  mutations,
  getters,
  actions
})
