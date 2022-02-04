import { ActionTree, createStore, GetterTree, MutationTree } from 'vuex'
import rotate from '../layout/rotate'
import sample from './sample2'
// import sample from './test.json'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import BaseItem from '@/types/interfaces/BaseItem'
import Connection from '@/types/interfaces/Connection'
import Group from '@/types/interfaces/Group'
import Item from '@/types/interfaces/Item'
import Point from '@/types/interfaces/Point'
import Port from '@/types/interfaces/Port'
import BoundingBox from '@/types/types/BoundingBox'
import CircuitService from '@/services/CircuitService'
import { cloneDeep } from 'lodash' // TODO

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

export interface DocumentState {
  cachedState: string | null
  undoStack: string[]
  redoStack: string[]
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
  waves: any,
  activeFreeportId: string | null
}

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

const actions: ActionTree<DocumentState, DocumentState> = {
  setZoom ({ commit }, zoom) {
    commit('SET_ZOOM', zoom)
  },

  saveIntegratedCircuit ({ state }) {
    const ports = cloneDeep(state.ports)
    const items = cloneDeep(state.items)
    const connections = cloneDeep(state.connections)
    const createNewPort = (rotation: number, orientation: number, type: PortType, prefix: string, elementId: string): Port => ({
      id: `${prefix}_${rand()}`,
      elementId,
      position: {
        x: 0,
        y: 0
      },
      rotation,
      orientation,
      type,
      value: 0,
      isFreeport: false
    })
    const createConnection = (id: string, source: string, target: string): Connection => ({
      id,
      source,
      target,
      connectionChainId: id,
      groupId: null,
      isSelected: false,
      zIndex: 0
    })

    const documentItems = {}
    const documentPorts = {}
    const documentConnections = {}

    const icItem: Item = {
      id: rand(),
      type: 'IntegratedCircuit',
      portIds: [],
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      position: {
        x: 400,
        y: 400
      },
      rotation: 0,
      isSelected: false,
      properties: {},
      groupId: null,
      zIndex: 0,
      width: 200,
      height: 150
    }

    Object
      .values(items)
      .forEach(item => {
        if (item.type === 'InputNode') {
          const docItem = {
            ...cloneDeep(item),
            id: rand()
          }
          const docPort = {
            ...cloneDeep(ports[item.portIds[0]]),
            id: rand()
          }
          const port = createNewPort(item.rotation, 0, PortType.Input, 'inputNode', icItem.id)

          item.type = 'CircuitNode'
          item.portIds.unshift(port.id)
          items[item.id] = item
          ports[port.id] = port
          icItem.portIds.push(port.id)

          docItem.portIds = [docPort.id]
          documentPorts[port.id] = port
          documentPorts[docPort.id] = docPort
          documentItems[docItem.id] = docItem

          const docConnection = createConnection(`doc_conn_${rand()}`, docPort.id, port.id)
          documentConnections[docConnection.id] = docConnection
        } else if (item.type === 'OutputNode') {
          const docItem = {
            ...cloneDeep(item),
            id: rand()
          }
          const docPort = {
            ...cloneDeep(ports[item.portIds[0]]),
            id: rand()
          }
          const port = createNewPort(item.rotation, 2, PortType.Output, 'outputNode', icItem.id)

          item.type = 'CircuitNode'
          item.portIds.unshift(port.id)
          items[item.id] = item
          ports[port.id] = port
          icItem.portIds.push(port.id)

          docItem.portIds = [docPort.id]
          documentPorts[port.id] = port
          documentPorts[docPort.id] = docPort
          documentItems[docItem.id] = docItem

          const docConnection = createConnection(`inner_ic_conn_${rand()}`, port.id, docPort.id)
          documentConnections[docConnection.id] = docConnection
        }
      })

    icItem.integratedCircuit = {
      items,
      connections,
      ports
    }
    documentItems[icItem.id] = icItem

    const circuit = {
      connections: documentConnections,
      items: documentItems,
      ports: documentPorts
    }

    console.log('IC: ', JSON.stringify(circuit, null, 2))
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
    dispatch('commitState')
    commit('ADD_ELEMENT', { item, ports })
    dispatch('setItemPortPositions', item.id)

    state.circuit.addNode(item, state.ports)
  },

  removeFreeport ({ commit, dispatch, state }, id: string) {
    const item = state.items[id]

    let originalSourceId = ''
    let originalTargetId = ''

    // find the true source and target port ids
    Object
      .values(state.connections)
      .forEach(c => {
        if (c.target === item.portIds[0]) originalSourceId = c.source
        if (c.source === item.portIds[1]) originalTargetId = c.target
      })

    if (originalSourceId) dispatch('disconnect', { source: originalSourceId, target: item.portIds[0] })
    if (originalTargetId) dispatch('disconnect', { source: item.portIds[1], target: originalTargetId })
    if (originalSourceId && originalTargetId) {
      // reconnect the true source and target
      dispatch('connect', { source: originalSourceId, target: originalTargetId })
    }

    // finally, remove the element
    state.circuit.removeNode(state.items[id].portIds)
    commit('REMOVE_ELEMENT', id)
  },

  cacheState ({ commit }) {
    commit('CACHE_STATE')
  },

  undo ({ commit, state }) {
    const undoState = state.undoStack.slice(-1)

    if (undoState) {
      commit('CACHE_STATE')
      commit('COMMIT_TO_REDO')
      commit('APPLY_STATE', undoState)
      commit('REMOVE_LAST_UNDO_STATE')
    }
  },

  redo ({ commit, state }) {
    const redoState = state.redoStack.slice(-1)

    if (redoState) {
      commit('CACHE_STATE')
      commit('COMMIT_TO_UNDO')
      commit('APPLY_STATE', redoState)
      commit('REMOVE_LAST_REDO_STATE')
    }
  },

  commitState ({ commit }) {
    commit('CACHE_STATE')
    commit('COMMIT_CACHED_STATE')
  },

  deleteSelection ({ commit, dispatch, state }) {
    dispatch('commitState')

    const nonFreeportItems = Object
      .values(state.items)
      .filter(({ isSelected, type }) => isSelected && type !== 'Freeport')
    const nonFreeportItemIds = nonFreeportItems.map(({ id }) => id)

    // select the full chains of each connection attached to each selected item
    Object
      .values(state.connections)
      .filter(c => {
        const sourcePort = state.ports[c.source]
        const targetPort = state.ports[c.target]

        if (sourcePort && targetPort) {
          return nonFreeportItemIds.includes(sourcePort.elementId) ||
            nonFreeportItemIds.includes(targetPort.elementId)
        }
      })
      .forEach(({ id }) => dispatch('toggleSelectionState', { id, forcedValue: true }))

    // remove all selected connections
    Object
      .values(state.connections)
      .filter(({ isSelected }) => isSelected)
      .forEach(connection => {
        dispatch('disconnect', {
          source: connection.source,
          target: connection.target
        })
      })

    // delete all selected non-freeport items
    nonFreeportItems.forEach(i => {
      const item = state.items[i.id]

      if (item.integratedCircuit) {
        Object
          .values(item.integratedCircuit?.items)
          .forEach(({ portIds }) => state.circuit.removeNode(portIds))
      } else {
        state.circuit.removeNode(state.items[i.id].portIds)
      }
      commit('REMOVE_ELEMENT', i.id)
    })

  // handle selected freeport deletions using removeFreeport
  Object
    .values(state.items)
    .filter(({ isSelected, type }) => isSelected && type === 'Freeport')
    .forEach(f => dispatch('removeFreeport', f.id))
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

    commit('COMMIT_CACHED_STATE')
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

    commit('COMMIT_CACHED_STATE')
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
    dispatch('commitState')

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

  ungroup ({ commit, dispatch, state }) {
    dispatch('commitState')

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

    dispatch('selectItemConnections', itemIds)
  },

  selectItemConnections ({ commit, state }, itemIds: string[]) {
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
    value?: number,
    sourceId?: string,
    targetId?: string,
    connectionChainId?: string
  }) {
    if (state.items[data.itemId]) return

    if (data.sourceId && data.targetId) {
      dispatch('commitState')
    }

    dispatch('deselectAll')
    commit('CREATE_FREEPORT_ELEMENT', data)
    dispatch('setItemBoundingBox', data.itemId)
    dispatch('setActiveFreeportId', data.itemId)

    state.circuit.addNode(state.items[data.itemId], state.ports, true, false)

    if (data.sourceId && data.targetId) {
      dispatch('disconnect', {
      // commit('DISCONNECT', {
        source: data.sourceId,
        target: data.targetId
      })
    }

    if (data.sourceId) {
      dispatch('connect', {
      // commit('CONNECT', {
        source: data.sourceId,
        target: data.inputPortId,
        zIndex: getters.nextZIndex,
        connectionChainId: data.connectionChainId
      })
    }

    if (data.targetId) {
      dispatch('connect', {
      // commit('CONNECT', {
        source: data.outputPortId,
        target: data.targetId,
        zIndex: getters.nextZIndex,
        connectionChainId: data.connectionChainId
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
      dispatch('commitState')

      if (sourceId) {
        dispatch('disconnect', {
          // commit('CONNECT', {
          source: sourceId,
          target: portId
        })
        dispatch('connect', {
        // commit('CONNECT', {
          source: sourceId,
          target: newPort.id
        })
      } else {
        dispatch('disconnect', {
          // commit('CONNECT', {
          source: portId,
          target: targetId
        })
        dispatch('connect', {
        // commit('CONNECT', {
          source: newPort.id,
          target: targetId
        })
      }

    }

    const item = Object
      .values(state.items)
      .find(({ portIds }) => portIds.includes(portId))

    if (item) {
      state.circuit.removeNode(item.portIds)
      commit('REMOVE_ELEMENT', item.id)
    }

    // commit('REMOVE_ELEMENT', item?.id)
    commit('SET_CONNECTABLE_PORT_IDS', [])
  },

  rotate ({ commit, dispatch, state }, direction: number) {
    dispatch('commitState')

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

  connect ({ commit, getters }, { source, target, connectionChainId }: { source: string, target: string, connectionChainId?: string }) {
    commit('CONNECT', { source, target, zIndex: getters.nextZIndex, connectionChainId })
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
  },

  setActiveFreeportId ({ commit }, activeFreeportId: string) {
    commit('SET_ACTIVE_FREEPORT_ID', activeFreeportId)
  }
}

const mutations: MutationTree<DocumentState> = {
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

  'SET_PORT_VALUES' (state, valueMap) {
    for (const portId in valueMap) {
      if (state.ports[portId])
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
      // select an individual item
      state.items[id].isSelected = isSelected
    } else if (state.connections[id]) {
      const connection = state.connections[id]
      const freeportIds: string[] = []

      // select all connection segments that are part of this connection chain
      Object
        .values(state.connections)
        .forEach(c => {
          if (connection.connectionChainId === c.connectionChainId) {
            const sourcePort = state.ports[c.source]
            const targetPort = state.ports[c.target]

            c.isSelected = isSelected

            if (sourcePort?.isFreeport) freeportIds.push(sourcePort.elementId)
            if (targetPort?.isFreeport) freeportIds.push(targetPort.elementId)
          }
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

  'CONNECT' (state, { source, target, zIndex, connectionChainId }) {
    const id = `conn_${rand()}`

    if (source && target) {
      state.connections[id] = {
        id,
        source,
        target,
        connectionChainId: connectionChainId || id,
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
