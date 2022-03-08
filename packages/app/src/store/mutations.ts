import { MutationTree } from 'vuex'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import SimulationService from '@/services/SimulationService'
import DocumentState from './DocumentState'
import getConnectionChain from '@/utils/getConnectionChain'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

const mutations: MutationTree<DocumentState> = {
  /**
   * Sets the current zoom level of the document.
   *
   * @param state
   * @param zoom - percentage as a decimal (e.g., 0.3 = 30%)
   */
  'SET_ZOOM' (state, zoom) {
    state.zoomLevel = zoom
  },

  /**
   * Stringifies and caches the current document state.
   * This will save all connections, items, ports, and groups.
   *
   * @param state
   */
  'CACHE_STATE' (state) {
    state.cachedState = JSON.stringify({
      connections: state.connections,
      items: state.items,
      ports: state.ports,
      groups: state.groups
    })
  },

  /**
   * Commits the actively-cached state to the undo stack.
   * This will clear the redo stack.
   *
   * @param state
   */
  'COMMIT_CACHED_STATE' (state) {
    if (state.cachedState) {
      state.undoStack.push(state.cachedState.toString())
      state.cachedState = null

      while (state.redoStack.length > 0) {
        state.redoStack.pop()
      }
    }
  },

  /**
   * Commits the actively-cached state to the redo stack.
   * This has the effect of setting a 'redo-able' action.
   *
   * @param state
   */
  'COMMIT_TO_REDO' (state) {
    if (state.cachedState) {
      state.redoStack.push(state.cachedState)
      state.cachedState = null
    }
  },

  /**
   * Commits the actively-cached state to the undo stack.
   * This has the effect of setting a 'undo-able' action.
   *
   * @param state
   */
  'COMMIT_TO_UNDO' (state) {
    if (state.cachedState) {
      state.undoStack.push(state.cachedState)
      state.cachedState = null
    }
  },

  /**
   * Removes the most recent undo state.
   *
   * @param state
   */
  'REMOVE_LAST_UNDO_STATE' (state) {
    state.undoStack.pop()
  },

  /**
   * Removes the most recent redo state.
   *
   * @param state
   */
  'REMOVE_LAST_REDO_STATE' (state) {
    state.redoStack.pop()
  },

  /**
   * Applies the given serialized state to the active document.
   *
   * This state must contain exactly these maps: `items`, `connections`, `ports`, `groups`.
   * Any other properties will not be applied.
   *
   * @param state
   * @param savedState - JSON-serialized state string
   */
  'APPLY_STATE' (state, savedState: string) {
    const { items, connections, ports, groups } = JSON.parse(savedState) as {
      items: { [id: string]: Item },
      connections: { [id: string]: Connection },
      ports: { [id: string]: Port },
      groups: { [id: string]: Group },
    }

    /* returns everything in a that is not in b */
    function getExcludedMembers (a: { [id: string]: BaseItem }, b: { [id: string]: BaseItem }) {
      const aIds = Object.keys(a)
      const bIds = Object.keys(b)

      return aIds.filter(id => !bIds.includes(id))
    }

    // find all items and connections in current state that are not in the applied state and remove them from the circuit
    const removedItems = getExcludedMembers(state.items, items)
    const removedConnections = getExcludedMembers(state.connections, connections)

    // add any new items from the the applied state to the circuit
    const addedItems = getExcludedMembers(items, state.items)
    const addedConnections = getExcludedMembers(connections, state.connections)
    const commit = this.commit as any // TODO: vuex type for this is wrong; submit bug report to vue team

    removedConnections.forEach(id => commit('DISCONNECT', state.connections[id]))
    removedItems.forEach(id => commit('REMOVE_ELEMENT', id))

    state.ports = ports
    state.items = items
    state.groups = groups

    addedItems.forEach(id => {
      if (items[id].integratedCircuit) {
        commit('ADD_INTEGRATED_CIRCUIT', {
          integratedCircuitItem: items[id],
          integratedCircuitPorts: ports
        })
      } else {
        commit('ADD_ELEMENT', {
          item: items[id],
          ports: Object.values(ports)
        })
      }
    })

    addedConnections.forEach(id => commit('CONNECT', connections[id]))
  },

  /**
   * Sets the circuit instance.
   *
   * @param state
   * @param circuit
   */
  'SET_CIRCUIT' (state, circuit: SimulationService) {
    state.simulation = circuit
  },

  /**
   * Applies the wave reference list to the one provided.
   *
   * @param state
   * @param waves
   */
  'SET_WAVE_LIST' (state, waves: WaveList) {
    state.waves = waves
  },

  /**
   * Assigns the given port to the state.
   *
   * @param state
   * @param port
   */
  'ADD_PORT' (state, port: Port) {
    state.ports[port.id] = port
    state.items[port.elementId].portIds.push(port.id)
  },

  /**
   * Removes a port from the state.
   * This will destroy the entire connection chain that it is a part of (if any).
   *
   * @param state
   * @param portId - ID of the port to destroy
   */
  'REMOVE_PORT' (state, portId: string) {
    // remove all connections associated with this port
    Object
      .values(state.connections)
      .filter(({ source, target }) => source === portId || target === portId)
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
            .simulation
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

    if (port) {
      const item = state.items[port.elementId]

      // remove the reference to the port from the element
      const portIndex = item.portIds.findIndex(i => i === portId)

      if (portIndex !== -1) {
        state.items[item.id].portIds.splice(portIndex, 1)
      }

      delete state.ports[portId]
    }
  },

  /**
   * Assigns values to the ports in the state according to the given map.
   *
   * @param state
   * @param valueMap - Port-ID-to-value mapping
   */
  'SET_PORT_VALUES' (state, valueMap: { [id: string]: number }) {
    for (const portId in valueMap) {
      if (state.ports[portId]) {
        state.ports[portId].value = valueMap[portId]
      }
    }
  },

  /**
   * Sets the value of the port in the circuit.
   *
   * @param state
   * @param payload.id - ID of the port
   * @param payload.value - new port value
   */
  'SET_PORT_VALUE' (state, { id, value }: { id: string, value: number }) {
    state
      .simulation
      .setPortValue(id, value)
  },

  /**
   * Adds any non-IC component to the state.
   *
   * @param state
   * @param payload
   * @param payload.item - new item to add
   * @param payload.ports - list of ports associated to the item
   */
  'ADD_ELEMENT' (state, { item, ports }: { item: Item, ports: Port[] }) {
    ports.forEach(port => {
      state.ports[port.id] = port
    })

    state.items[item.id] = item

    state
      .simulation
      .addNode(item, state.ports)
  },

  /**
   * Adds the given integrated circuit component to the state.
   *
   * @param state
   * @param payload
   * @param payload.integratedCircuitItem - the IC to add
   * @param payload.integratedCircuitPorts - ID-to-Port map of visibile IC ports to add
   */
  'ADD_INTEGRATED_CIRCUIT' (state, { integratedCircuitItem, integratedCircuitPorts }: {
    integratedCircuitItem: Item,
    integratedCircuitPorts: { [id: string]: Port }
  }) {
    if (!integratedCircuitItem.integratedCircuit) return

    // assign the visible IC ports
    Object
      .values(integratedCircuitPorts)
      .forEach(port => {
        state.ports[port.id] = port
      })

    state.items[integratedCircuitItem.id] = integratedCircuitItem

    state
      .simulation
      .addIntegratedCircuit(integratedCircuitItem, integratedCircuitPorts)
  },

  /**
   * Removes an element and all its associated ports and circuit nodes from the state.
   *
   * @param state
   * @param id - ID of the item to remove
   */
  'REMOVE_ELEMENT' (state, id: string) {
    const item = state.items[id]

    if (item.integratedCircuit) {
      // remove all circuit nodes associated with the integrated circuit
      Object
        .values(item.integratedCircuit.items)
        .forEach(({ portIds }) => {
          state
            .simulation
            .removeNode(portIds)
        })
    } else {
      // remove the sole circuit node
      state
        .simulation
        .removeNode(item.portIds)
    }

    // remove all ports associated with the item
    item.portIds.forEach(portId => {
      delete state.ports[portId]
    })

    // remove the item
    delete state.items[id]
  },

  /**
   * Displays the ports of the given item in the oscilloscope.
   *
   * @param state
   * @param id - ID of the item to monitor
   */
  'ADD_TO_OSCILLOSCOPE' (state, id: string) {
    const item = state.items[id]
    const portType = item.type === ItemType.OutputNode
      ? PortType.Input // output elements (lightbulb, etc.) will monitor incoming port values
      : PortType.Output // all other elements will monitor the outgoing port values

    item
      .portIds
      .forEach(portId => {
        const port = state.ports[portId]

        if (port.type === portType) {
          state
            .simulation
            .monitorPort(portId, port.value)
        }
      })
  },

  /**
   * Removes the ports from the oscilloscope display for the given item.
   *
   * @param state
   * @param id - ID of the item to unmonitor
   */
  'REMOVE_FROM_OSCILLOSCOPE' (state, id: string) {
    const item = state.items[id]

    item
      .portIds
      .forEach(portId => {
        state
          .simulation
          .unmonitorPort(portId)
      })
  },

  /**
   * Sets the given property value of the given item.
   *
   * @param state
   * @param payload
   * @param payload.id - ID of the item containing the property
   * @param payload.propertyName - name of the property to change
   * @param payload.value - new property value
   */
  'SET_ITEM_PROPERTY' (state, { id, propertyName, value }: { id: string, propertyName: string, value: any }) {
    state.items[id].properties[propertyName].value = value
  },

  /**
   * set the width and height of the item to the values provided
   *
   * @param state
   * @param payload
   * @param payload.id - ID of the item to mutate
   * @param payload.rect - rect values, containing the desired width and height
   */
  'SET_ELEMENT_SIZE' (state, { id, rect }: { id: string, rect: DOMRectReadOnly }) {
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

  /**
   * Sets the selection state for all connections, items, and groups to the given value.
   *
   * @param state
   * @param isSelected
   */
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

  /**
   * Sets the selection state of the given element to the value provided.
   * If the item is a connection segment, then its entire connection chain will take on the same value.
   *
   * @param state
   * @param payload
   * @param payload.id - ID of the item, group, or connection to select
   * @param payload.isSelected - selection state to change to
   */
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

  'SET_CONNECTABLE_PORT_IDS' (state, connectablePortIds: string[]) {
    state.connectablePortIds = connectablePortIds
  },

  /**
   * Establishes a new connection between two ports.
   *
   * @param state
   * @param payload
   * @param payload.source - source port ID
   * @param payload.target - target port ID
   * @param payload.connectionChainId - optional connection chain ID to add the connection segment to
   */
  'CONNECT' (state, { source, target, connectionChainId }: { source?: string, target?: string, connectionChainId?: string }) {
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

      state
        .simulation
        .addConnection(source, target)
    }
  },

  /**
   * Disconnects two ports.
   *
   * @param state
   * @param payload
   * @param payload.source - source port ID
   * @param payload.target - target port ID
   */
  'DISCONNECT' (state, { source, target }: { source: string, target: string }) {
    const connection = Object
      .values(state.connections)
      .find(c => c.source === source && c.target === target)

    if (connection) {
      state
        .simulation
        .removeConnection(source, target)

      delete state.connections[connection.id]
    }
  },

  /**
   * Applies a group to the state, setting its ID on all applicable items and connections.
   *
   * @param state
   * @param group - new group instance to add
   */
  'GROUP_ITEMS' (state, group: Group) {
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

  /**
   * Destroys the group having the given ID.
   *
   * @param state
   * @param groupId
   */
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

  /**
   * Adds a new freeport element. This can be used in either of two scenarios:
   *
   *  1. when a user is dragging a port to establish a connection to another port
   *  2. when a user drags on a connection to create a new "pivot point" on the wire
   *
   * @param state
   * @param payload
   * @param payload.itemId - desired ID for the new freeport
   * @param payload.inputPortId - the ID of the input port (omit for a wire drag from an output port)
   * @param payload.outputPortId - the ID of the output port (omit for a wire drag from an input port)
   * @param payload.position - the initial position of this port
   * @param payload.value - optional value of the port
   */
  'CREATE_FREEPORT_ELEMENT' (state, { itemId, inputPortId, outputPortId, position, value }: {
    itemId: string
    position: Point
    outputPortId?: string
    inputPortId?: string
    value?: number
  }) {
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
      state.ports[inputPortId] = createPort(inputPortId, PortType.Input, Direction.Right)
      portIds.push(inputPortId)
    }

    if (outputPortId) {
      state.ports[outputPortId] = createPort(outputPortId, PortType.Output, Direction.Left)
      portIds.push(outputPortId)
    }

    state.items[itemId] = {
      id: itemId,
      type: ItemType.Freeport,
      subtype: ItemSubtype.None,
      portIds,
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
      zIndex: 3,
      width: 1,
      height: 1
    }

    state
      .simulation
      .addNode(state.items[itemId], state.ports, true)
  },

  /**
   * Rotates an element by the given value.
   *
   * @param state
   * @param payload
   * @param payload.id - ID of the item to rotate
   * @param payload.rotation - unit circle rotation value (negative for CCW rotation)
   */
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

export default mutations
