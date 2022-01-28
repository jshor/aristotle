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
}

const state: DocumentState = {
  snapBoundaries: [],
  connectablePortIds: [],
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

  addItem ({ commit, dispatch }, { item, ports }: { item: Item, ports: Port[] }) {
    commit('ADD_ELEMENT', { item, ports })
    dispatch('setItemPortPositions', item.id)
  },

  removeItem ({ commit, state }, id: string) {
    const item = state.items[id]

    if (!item) return

    // remove all connections first
    const connections: Connection[] = Object
      .values(state.connections)
      .filter(c => item.portIds.includes(c.source) || item.portIds.includes(c.target))

    connections.forEach(c => {
      commit('DISCONNECT', {
        source: c.source,
        target: c.target
      })
    })

    if (item.type === 'Freeport' && connections.length === 2) {
      // if this is a freeport, then reconnect the two disconnected wires
      commit('CONNECT', {
        source: connections[0].source,
        target: connections[1].target
      })
    }

    // remove the item
    commit('REMOVE_ELEMENT', id)
  },

  setSnapBoundaries ({ commit, state }, id: string) {
    const snapBoundaries = ((): BoundingBox[] => {
      const item = state.items[id]

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
      ports.forEach(port => {
        const spacing = (port.orientation + item.rotation) % 2 === 0
          ? Math.floor((bottom - top) / (ports.length + 1))
          : Math.floor((right - left) / (ports.length + 1))
        const position = (() => {
          switch (rotate(port.orientation + item.rotation)) {
            case Direction.Left:
              return { x: left, y: top + spacing }
            case Direction.Top:
              return { x: left + spacing, y: top }
            case Direction.Right:
              return { x: right, y: top + spacing }
            case Direction.Bottom:
              return { x: left + spacing, y: bottom }
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

  moveItemPosition ({ commit, dispatch, state }, { id, delta, isMovedByGroup = false }: { id: string, delta: Point, isMovedByGroup: boolean }) {
    const item = state.items[id]

    if (!item) return

    if (item.groupId && !isMovedByGroup) {
      // if the item is part of a group, move the entire group instead
      return dispatch('moveGroupPosition', { id: item.groupId, delta })
    }

    commit('SET_ELEMENT_POSITION', {
      id,
      position: {
        x: item.position.x + delta.x,
        y: item.position.y + delta.y
      }
    })

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

  moveGroupPosition ({ commit, dispatch, state }, { id, delta }) {
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

        dispatch('moveItemPosition', {
          id: item.id,
          isMovedByGroup: true,
          delta
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

  createFreeport ({ commit, dispatch }, data) {
    dispatch('deselectAll')
    commit('CREATE_FREEPORT_ELEMENT', data)
    dispatch('setItemBoundingBox', data.itemId)

    if (data.sourceId && data.targetId) {
      commit('DISCONNECT', {
        source: data.sourceId,
        target: data.targetId
      })
    }

    if (data.sourceId) {
      commit('CONNECT', {
        source: data.sourceId,
        target: data.outputPortId,
        zIndex: getters.nextZIndex
      })
    }

    if (data.targetId) {
      commit('CONNECT', {
        source: data.inputPortId,
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

    connectedPortIds.splice(-2) // remove the last two items (the currently-dragged connection)

    const filter = port.type === PortType.Output
      ? (p: Port) => p.type === PortType.Input && !p.isFreeport && !connectedPortIds.includes(p.id)
      : (p: Port) => p.type === PortType.Output && !p.isFreeport && !connectedPortIds.includes(port.id)

    const portIds: string[] = []
    const snapBoundaries: BoundingBox[] = []

    Object
      .values(state.ports)
      .filter(filter)
      .forEach(({ id, position }: Port) => {
        snapBoundaries.push({
          left: position.x,
          top: position.y,
          right: position.x,
          bottom: position.y
        })
        portIds.push(id)
      })

    commit('SET_CONNECTABLE_PORT_IDS', portIds)
    commit('SET_SNAP_BOUNDARIES', snapBoundaries)
  },

  rotateFreeport ({ commit }, { id, rotation }: { id: string, rotation: number }) {
    commit('ROTATE_ELEMENT', { id, rotation })
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
        commit('CONNECT', {
          source: sourceId,
          target: newPort.id
        })
      } else {
        commit('CONNECT', {
          source: newPort.id,
          target: targetId
        })
      }
    }

    const item = Object
      .values(state.items)
      .find(({ portIds }) => portIds.includes(portId))

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

          const x = newAx - (item.width / 2)
          const y = newAy - (item.height / 2)

          const delta = {
            x: x - item.position.x,
            y: y - item.position.y
          }

          commit('ROTATE_ELEMENT', {
            id: itemId,
            rotation: rotate(item.rotation + direction)
          })
          dispatch('moveItemPosition', { id: itemId, delta, isMovedByGroup: true })
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
  },

  disconnect ({ commit }, { source, target }: { source: string, target: string }) {
    commit('DISCONNECT', { source, target })
  },

  selectBaseItems ({ commit }, ids: string[]) {
    commit('GROUP_ITEMS', ids)
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
  }
}

const mutations: MutationTree<DocumentState> = {
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
      rotation: 0
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