import { ActionTree, createStore, GetterTree, MutationTree } from 'vuex'
import rotate from '../layout/rotate'
import sample from './sample'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import BaseItem from '@/types/interfaces/BaseItem'
import Connection from '@/types/interfaces/Connection'
import Group from '@/types/interfaces/Group'
import Item from '@/types/interfaces/Item'
import Point from '@/types/interfaces/Point'
import Port from '@/types/interfaces/Port'
import BoundingBox from '@/types/types/BoundingBox'
import { Nor } from '@aristotle/logic-circuit'
import CircuitService from '@/services/CircuitService'

const rand = () => `id_${(Math.floor(Math.random() * 100) + 5)}` // TODO: use uuid

export interface DocumentState {
  snapBoundaries: BoundingBox[]
  connectablePortIds: string[]
  ports: {
    [id: string]: Port
  }
  items: {
    [id: string]: Item
  }
  connections: {
    [id: string]: Connection
  }
  groups: {
    [id: string]: Group
  }
  zoomLevel: number
  circuit: CircuitService,
  waves: any
}

const state: DocumentState = {
  snapBoundaries: [],
  connectablePortIds: [],
  circuit: new CircuitService([], [], {}),
  waves: {},
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

  nextZIndex (state) {
    return Object.keys(state.items).length + Object.keys(state.connections).length
  }
}

const actions: ActionTree<DocumentState, DocumentState> = {
  setZoom ({ commit }, zoom) {
    commit('SET_ZOOM', zoom)
  },

  buildCircuit ({ commit, state }) {
    const circuit = new CircuitService(Object.values(state.items), Object.values(state.connections), state.ports)

    circuit.onChange((valueMap: any, wave: any) => {
      commit('SET_PORT_VALUES', valueMap)
      commit('SET_WAVE_LIST', wave)
    })

    commit('SET_CIRCUIT', circuit)
  },

  addItem ({ commit, dispatch, state }, { item, ports }: { item: Item, ports: Port[] }) {
    commit('ADD_ELEMENT', { item, ports })
    dispatch('setItemPortPositions', item.id)

    state.circuit.addNode(item, state.ports)
  },

  removeItem ({ commit, dispatch, state }, id: string) {
    const item = state.items[id]

    if (!item) return

    // find all first-degree connections first
    const connections: Connection[] = Object
      .values(state.connections)
      .filter(c => item.portIds.includes(c.source) || item.portIds.includes(c.target))

    connections.forEach(c => {
      dispatch('removeConnection', { id: c.id, removeLineage: true })
    })

    if (item.type === 'Freeport' && connections.length === 2) {
      // if this is a freeport, then reconnect the two disconnected wires
      dispatch('connect', {
        source: connections[0].source,
        target: connections[1].target
      })
    }

    // remove the item
    if (state.items[id]) {
      state.circuit.removeNode(state.items[id].portIds)
      commit('REMOVE_ELEMENT', id)
    }
  },

  deleteSelection ({ dispatch, state }) {
    const connection = Object
      .values(state.connections)
      .filter(({ isSelected }) => isSelected)
    const items = Object
      .values(state.items)
      .filter(({ isSelected }) => isSelected)

    items.forEach(i => {
      dispatch('removeItem', i.id)
    })
    connection.forEach(c => {
      dispatch('removeConnection', { id: c.id })
    })
  },

  removeConnection ({ dispatch, state }, { id, removeLineage }: { id: string, removeLineage?: boolean }) {
    const connection = state.connections[id]

    if (!connection) return

    const connections = Object.values(state.connections)
    const freeportConnectionMap: Record<string, string> = {}
    const freeportIds: string[] = []

    Object
      .values(state.items)
      .filter(({ type }) => type === 'Freeport')
      .forEach(item => {
        freeportIds.push(item.id)
        freeportConnectionMap[item.portIds[0]] = item.portIds[1]
      })

    function getFollowedConnections (conns: Connection[]) {
      const l = conns.slice(-1).pop()

      if (l && freeportConnectionMap[l.target]) {
        const c = connections.find(({ source }) => source === freeportConnectionMap[l.target])

        if (c) return getFollowedConnections(conns.concat(c))
      }

      return conns
    }

    if (removeLineage) {
      // remove all related segments of this connection, including freeports
      getFollowedConnections([connection]).forEach(({ source, target }) => {
        dispatch('disconnect', { source, target })
      })

      freeportIds.forEach(id => {
        dispatch('removeItem', state.items[id]?.id)
      })
    } else {
      // otherwise, remove just this segment
      dispatch('disconnect', {
        source: connection.source,
        target: connection.target
      })

      // TODO: need to reconnect ancestor of source and successor of target
    }
  },

  setSnapBoundaries ({ commit, state }, id: string) {
    const snapBoundaries = ((): BoundingBox[] => {
      const item = state.items[id]

      if (state.connectablePortIds.length) {
        // if there are connectable port ids, then use those for boundaries
        return state
          .connectablePortIds
          .map(id => {
            const port = state.ports[id]

            return {
              left: port.position.x,
              top: port.position.y,
              right: port.position.x,
              bottom: port.position.y
            } as BoundingBox
          })
      }

      if (item && !item.groupId) {
        // the item with the given id is an item that does not belong to a group
        if (item.type === 'Freeport') {
          if (item.portIds.length > 1) {
            // if only one port exists on the freeport, then it is a port being dragged by the user and does not apply
            // find all connectable ports and set their boundaries
            const createPortSnapBoundaries = (port: Port): BoundingBox[] => ([
              {
                left: port.position.x,
                right: port.position.x,
                top: -Infinity,
                bottom: Infinity
              },
              {
                left: -Infinity,
                right: Infinity,
                top: port.position.y,
                bottom: port.position.y
              }
            ])

            // freeports should snap to "straighten out" wires
            return Object
              .values(state.connections)
              .reduce((boundingBoxes: BoundingBox[], connection: Connection) => {
                if (item.portIds.includes(connection.source)) {
                  return boundingBoxes.concat(createPortSnapBoundaries(state.ports[connection.target]))
                }

                if (item.portIds.includes(connection.target)) {
                  return boundingBoxes.concat(createPortSnapBoundaries(state.ports[connection.source]))
                }

                return boundingBoxes
              }, [])
          }
        } else {
          // this an item that can snap to align with the outer edge of any non-freeport item
          return Object
            .values(state.items)
            .filter(e => e.id !== id && e.type !== 'Freeport')
            .map(e => e.boundingBox)
        }
      }
      return []
    })()

    commit('SET_SNAP_BOUNDARIES', snapBoundaries)
  },

  setItemSize ({ commit, dispatch, state }, { rect, id }: { rect: DOMRectReadOnly, id: string }) {
    const item = state.items[id]

    if (!item) return

    // reposition w.r.t. the centroid
    const centerX = item.position.x + (item.width / 2)
    const centerY = item.position.y + (item.height / 2)
    const newX = centerX - (rect.width / 2)
    const newY = centerY - (rect.height / 2)

    commit('SET_ELEMENT_POSITION', {
      id,
      position: {
        x: newX,
        y: newY
      }
    })
    commit('SET_ELEMENT_SIZE', { rect, id })

    dispatch('setItemBoundingBox', id)
    dispatch('setItemPortPositions', id)

    if (state.items[id].groupId) {
      dispatch('setGroupBoundingBox', state.items[id].groupId)
    }
  },

  setItemPortPositions ({ commit, state }, id: string) {
    const item = state.items[id]

    if (!item) return

    const { left, top, bottom, right } = item.boundingBox
    const portGroups = item
      .portIds
      .reduce((portGroups: Map<Direction, Port[]>, portId) => {
        const port = state.ports[portId]

        if (port) {
          const index: Direction = rotate(port.orientation + item.rotation)

          portGroups.get(index)?.push(port)
        }

        return portGroups
      }, new Map<Direction, Port[]>([
        [Direction.Left, []],
        [Direction.Top, []],
        [Direction.Right, []],
        [Direction.Bottom, []]
      ]))

    const setPortGroupPositions = (ports: Port[] = []) => {
      ports.forEach((port, index) => {
        // ports use CSS "space around" flex property for positions
        // compute the spacing of each port based on the element width/height
        // there are n spacings for n ports
        const spacing = (port.orientation + item.rotation) % 2 === 0
          ? Math.floor((bottom - top) / ports.length)
          : Math.floor((right - left) / ports.length)
        // compute the distance (from left-to-right or top-to-bottom)
        // the distance will be the center of the computed spacing
        const distance = (spacing * (index + 1)) - (spacing / 2)
        const position = (() => {
          switch (rotate(port.orientation + item.rotation)) {
            case Direction.Left:
              return { x: left, y: top + distance }
            case Direction.Top:
              return { x: right - distance, y: top }
            case Direction.Right:
              return { x: right, y: bottom - distance }
            case Direction.Bottom:
              return { x: left + distance, y: bottom }
          }
        })()

        commit('SET_PORT_POSITION', {
          id: port.id,
          position
        })
      })
    }

    setPortGroupPositions(portGroups.get(Direction.Left))
    setPortGroupPositions(portGroups.get(Direction.Top))
    setPortGroupPositions(portGroups.get(Direction.Right))
    setPortGroupPositions(portGroups.get(Direction.Bottom))
  },

  setItemPosition ({ commit, dispatch, state }, { id, position, isMovedByGroup }: { id: string, position: Point, isMovedByGroup?: boolean }) {
    const item = state.items[id]
    const delta = {
      x: position.x - item.position.x,
      y: position.y - item.position.y
    }

    if (item.groupId && !isMovedByGroup) {
      // if the item is part of a group, move the entire group instead
      return dispatch('moveGroupPosition', { id: item.groupId, delta })
    }

    commit('SET_ELEMENT_POSITION', { id, position })
    commit('SET_ELEMENT_BOUNDING_BOX', {
      id,
      boundingBox: {
        left: item.boundingBox.left + delta.x,
        top: item.boundingBox.top + delta.y,
        bottom: item.boundingBox.bottom + delta.y,
        right: item.boundingBox.right + delta.x
      }
    })

    item
      .portIds
      .forEach(portId => {
        const port = state.ports[portId]

        if (!port) return

        commit('SET_PORT_POSITION', {
          id: portId,
          position: {
            x: port.position.x + delta.x,
            y: port.position.y + delta.y
          }
        })
      })
  },

  moveGroupPosition ({ commit, dispatch, state }, { id, delta }: { id: string, delta: Point }) {
    const group = state.groups[id]

    commit('SET_GROUP_BOUNDING_BOX', {
      boundingBox: {
        left: group.boundingBox.left + delta.x,
        top: group.boundingBox.top + delta.y,
        right: group.boundingBox.right +  delta.x,
        bottom: group.boundingBox.bottom + delta.y
      },
      id
    })

    group
      .itemIds
      .forEach(itemId => {
        const item = state.items[itemId]

        dispatch('setItemPosition', {
          id: item.id,
          isMovedByGroup: true,
          position: {
            x: item.position.x + delta.x,
            y: item.position.y + delta.y
          }
        })
      })
  },

  setItemBoundingBox ({ commit, state }, id: string) {
    const item = state.items[id]

    if (!item) return
    if (item.rotation % 2 === 0) {
      // item is right side up or upside down
      commit('SET_ELEMENT_BOUNDING_BOX', {
        id,
        boundingBox: {
          left: item.position.x,
          top: item.position.y,
          bottom: item.height + item.position.y,
          right: item.width + item.position.x
        }
      })
    } else {
      // item is rotated at a 90 degree angle (CW or CCW)
      const midX = item.position.x + (item.width / 2)
      const midY = item.position.y + (item.height / 2)

      commit('SET_ELEMENT_BOUNDING_BOX', {
        id,
        boundingBox: {
          left: midX - (item.height / 2),
          top: midY - (item.width / 2),
          right: midX + (item.height / 2),
          bottom: midY + (item.width / 2)
        }
      })
    }
  },

  setGroupBoundingBox ({ commit, state }, id: string) {
    if (!id) return
    const group = state.groups[id]
    const rect = group.itemIds.reduce((rect, id) => {
      const { boundingBox } = state.items[id]

      return {
        left: Math.min(rect.left, boundingBox.left),
        top: Math.min(rect.top, boundingBox.top),
        right: Math.max(rect.right, boundingBox.right),
        bottom: Math.max(rect.bottom, boundingBox.bottom)
      }
    }, {
      left: Infinity,
      top: Infinity,
      right: 0,
      bottom: 0
    })

    commit('SET_GROUP_BOUNDING_BOX', { boundingBox: rect, id })
  },

  group ({ commit, dispatch, state }) {
    const id = rand()
    const itemIds = Object
      .keys(state.items)
      .filter(id => state.items[id].isSelected)
    const connectionIds = Object
      .keys(state.connections)
      .filter(id => state.connections[id].isSelected)

    commit('GROUP_ITEMS', { id, itemIds, connectionIds, isSelected: true })
    dispatch('setGroupBoundingBox', id)
  },

  ungroup ({ commit, state }) {
    for (const id in state.groups) {
      if (state.groups[id].isSelected) {
        commit('UNGROUP', id)
      }
    }
  },

  createSelection ({ commit, dispatch, state }, selection: BoundingBox) {
    const scaled: BoundingBox = {
      left: selection.left / state.zoomLevel,
      top: selection.top / state.zoomLevel,
      bottom: selection.bottom / state.zoomLevel,
      right: selection.right / state.zoomLevel
    }

    const itemIds = Object
      .keys(state.items)
      .filter(id => {
        const { boundingBox } = state.items[id]

        if (scaled.left >= boundingBox.right || boundingBox.left >= scaled.right) {
          // one rect is on left side of other
          return false
        }

        if (scaled.top >= boundingBox.bottom || boundingBox.top >= scaled.bottom) {
          // one rect is above other
          return false
        }

        return true
      })

    itemIds.forEach(id => {
      commit('SET_SELECTION_STATE', { id, isSelected: true })
    })

    dispatch('selectConnections', itemIds)
  },

  selectConnections ({ commit, state }, itemIds: string[]) {
    const portIds = itemIds.reduce((portIds: string[], itemId: string) => {
      return portIds.concat(state.items[itemId].portIds)
    }, [])

    for (let id in state.connections) {
      const c = state.connections[id]

      if (portIds.includes(c.source) || portIds.includes(c.target)) {
        commit('SET_SELECTION_STATE', { id, isSelected: true })
      }
    }
  },

  deselectAll ({ commit }) {
    commit('SET_ALL_SELECTION_STATES', false)
  },

  selectAll ({ commit }) {
    commit('SET_ALL_SELECTION_STATES', true)
  },

  toggleSelectionState ({ commit, state }, { id, forcedValue = null }: { id: string, forcedValue: boolean | null }) {
    const item = state.items[id] || state.connections[id] || state.groups[id]
    if (!item) return
    const isSelected = forcedValue === null
      ? !item.isSelected
      : forcedValue

    if (item.groupId) {
      // if item is part of a group, select all items in that group
      const { itemIds, connectionIds } = state.groups[item.groupId]

      itemIds
        .concat(connectionIds)
        .forEach(id => {
          commit('SET_SELECTION_STATE', { id, isSelected })
        })

      commit('SET_SELECTION_STATE', { id: item.groupId, isSelected })
    } else {
      // otherwise, just select this one item
      commit('SET_SELECTION_STATE', { id, isSelected })
    }
  },

  createFreeport ({ commit, dispatch, state }, data: {
    itemId: string,
    outputPortId: string,
    inputPortId: string,
    sourceId?: string,
    targetId?: string
  }) {
    if (state.items[data.itemId]) return

    dispatch('deselectAll')
    commit('CREATE_FREEPORT_ELEMENT', data)
    dispatch('setItemBoundingBox', data.itemId)

    state.circuit.addNode(state.items[data.itemId], state.ports)

    if (data.sourceId && data.targetId) {
      dispatch('disconnect', {
        source: data.sourceId,
        target: data.targetId
      })
    }

    console.log('DATA:', data)
    if (data.sourceId) {
      dispatch('connect', {
        source: data.sourceId,
        target: data.inputPortId,
        zIndex: getters.nextZIndex
      })
    }

    if (data.targetId) {
      dispatch('connect', {
        source: data.outputPortId,
        target: data.targetId,
        zIndex: getters.nextZIndex
      })
    }
  },

  setConnectablePortIds ({ commit, state }, portId: string) {
    const port = state.ports[portId]

    if (port.isFreeport) return // freeports cannot connect to anything

    const connectedPortIds = Object
      .values(state.connections)
      .reduce((portIds: string[], connection: Connection) => {
        if (state.ports[portId].isFreeport) {
          return portIds
        }
        return portIds.concat([connection.source, connection.target])
      }, [])

    connectedPortIds.splice(-2) // remove the last two ports (the two ports on opposite ends of the currently-dragged connection)

    const filter = port.type === PortType.Output
      ? (p: Port) => p.type === PortType.Input && !p.isFreeport && !connectedPortIds.includes(p.id)
      : (p: Port) => p.type === PortType.Output && !p.isFreeport && !connectedPortIds.includes(port.id)

    commit('SET_CONNECTABLE_PORT_IDS', Object
      .values(state.ports)
      .filter(filter)
      .map(({ id }) => id))
  },

  connectFreeport ({ commit, dispatch, state }, { sourceId, targetId, portId }: { sourceId?: string, targetId?: string, portId: string }) {
    const port = state.ports[portId]
    const newPort = Object
      .values(state.ports)
      .find((p: Port) => {
        const distX = Math.pow(p.position.x - port.position.x, 2)
        const distY = Math.pow(p.position.y - port.position.y, 2)

        return Math.sqrt(distX + distY) <= 10 && p.id !== portId && state.connectablePortIds.includes(p.id)
      })

    if (newPort) {
      if (sourceId) {
        dispatch('connect', {
          source: sourceId,
          target: newPort.id
        })
      } else {
        dispatch('connect', {
          source: newPort.id,
          target: targetId
        })
      }
    }

    const item = Object
      .values(state.items)
      .find(({ portIds }) => portIds.includes(portId))

    console.log('REMOVE? ', item)

    dispatch('removeItem', item?.id)
    commit('SET_CONNECTABLE_PORT_IDS', [])
  },

  rotate ({ commit, dispatch, state }, direction: number) {
    for (const id in state.groups) {
      const group = state.groups[id]

      if (group.isSelected) {
        // rotate all selected groups
        const w = group.boundingBox.right - group.boundingBox.left
        const h = group.boundingBox.bottom - group.boundingBox.top
        const mx = group.boundingBox.left + (w / 2)
        const my = group.boundingBox.top + (h / 2)

        group.itemIds.forEach(itemId => {
          const item = state.items[itemId]
          const cx = item.position.x
          const cy = item.position.y
          const ax = cx + (item.width / 2)
          const ay = cy + (item.height / 2)
          const L = Math.sqrt(Math.pow((mx - ax), 2) + Math.pow((my - ay), 2))
          const currentAngleRad = Math.atan2((ay - my), (ax - mx))
          const newAngle = (90 * direction * (Math.PI / 180)) + currentAngleRad
          const newAx = (L * Math.cos(newAngle)) + mx
          const newAy = (L * Math.sin(newAngle)) + my
          const position = {
            x: newAx - (item.width / 2),
            y: newAy - (item.height / 2)
          }

          commit('ROTATE_ELEMENT', {
            id: itemId,
            rotation: rotate(item.rotation + direction)
          })
          dispatch('setItemPosition', { id: itemId, position, isMovedByGroup: true })
          dispatch('setItemBoundingBox', itemId)
          dispatch('setItemPortPositions', itemId)
        })

        dispatch('setGroupBoundingBox', id)
      }
    }

    for (const id in state.items) {
      const item = state.items[id]

      if (item.isSelected && !item.groupId) {
        // rotate all selected, non-grouped items
        commit('ROTATE_ELEMENT', {
          id,
          rotation: rotate(item.rotation + direction)
        })
        dispatch('setItemBoundingBox', id)
        dispatch('setItemPortPositions', id)
      }
    }
  },

  connect ({ commit, getters }, { source, target }: { source: string, target: string }) {
    commit('CONNECT', { source, target, zIndex: getters.nextZIndex })
    state.circuit.addConnection(source, target)
  },

  disconnect ({ commit }, { source, target }: { source: string, target: string }) {
    state.circuit.removeConnection(source, target)
    commit('DISCONNECT', { source, target })
  },

  changeSelectionZIndex ({ commit, state }, fn: (i: BaseItem) => number) {
    const items: BaseItem[] = Object
      .values(state.items)
      .filter(({ isSelected }) => isSelected)
    const connections: BaseItem[] = Object
      .values(state.items)
      .filter(({ isSelected }) => isSelected)

    items
      .concat(connections)
      .forEach(item => {
        commit('SET_Z_INDEX', { item, zIndex: fn(item) })
      })
  },

  sendBackward ({ dispatch }) {
    dispatch('changeSelectionZIndex', (i: BaseItem) => i.zIndex - 1)
  },

  bringForward ({ dispatch }) {
    dispatch('changeSelectionZIndex', (i: BaseItem) => i.zIndex + 1)
  },

  sendToBack ({ dispatch, getters }) {
    dispatch('changeSelectionZIndex', (i: BaseItem) => getters.zIndex)
  },

  bringToFront ({ dispatch }) {
    dispatch('changeSelectionZIndex', (i: BaseItem) => 0)
  },

  setPortValue ({ commit, state }, { id, value }: { id: string, value: number }) {
    commit('SET_PORT_VALUES', { [id]: value })
    state.circuit.setPortValue(id, value)
  }
}

const mutations: MutationTree<DocumentState> = {
  'SET_CIRCUIT' (state, circuit: CircuitService) {
    state.circuit = circuit
  },

  'SET_WAVE_LIST' (state, waves: WaveList) {
    state.waves = waves
  },

  'SET_PORT_VALUES' (state, valueMap) {
    for (const portId in valueMap) {
      state.ports[portId].value = valueMap[portId]
    }
  },

  'ADD_ELEMENT' (state, { item, ports }: { item: Item, ports: Port[] }) {
    state.items[item.id] = item

    ports.forEach(port => {
      state.ports[port.id] = port
    })
  },

  'REMOVE_ELEMENT' (state, id: string) {
    state.items[id].portIds.forEach(portId => {
      delete state.ports[portId]
    })
    delete state.items[id]
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
      state.items[id].isSelected = isSelected
    } else if (state.connections[id]) {
      state.connections[id].isSelected = isSelected
    } else if (state.groups[id]) {
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

  'CONNECT' (state, { source, target, zIndex }) {
    const id = `conn_${rand()}`

    if (source && target) {
      state.connections[id] = {
        id,
        source,
        target,
        trueTargetId: target,
        groupId: null,
        zIndex,
        isSelected: false
      }
    }
  },

  'DISCONNECT' (state, { source, target }) {
    const connection = Object
      .values(state.connections)
      .find(c => c.source === source && c.target === target)

    if (connection) {
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
    { itemId, inputPortId, outputPortId, position }:
    { itemId: string, position: Point, outputPortId?: string, inputPortId?: string }
  ) {
    const createPort = (id: string, type: PortType, orientation: Direction) => ({
      id,
      type,
      orientation,
      isFreeport: true,
      position: {
        x: 0,
        y: 0
      },
      rotation: 0,
      value: 0
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
}

export default createStore({
  state,
  mutations,
  getters,
  actions
})
