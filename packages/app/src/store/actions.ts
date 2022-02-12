import { ActionTree } from 'vuex'
import rotate from '../layout/rotate'
import { cloneDeep } from 'lodash' // TODO
import DocumentState from './DocumentState'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import CircuitService from '@/services/CircuitService'
import boundaries from '@/layout/boundaries'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

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

  addItem ({ commit, dispatch }, { item, ports }: { item: Item, ports: Port[] }) {
    dispatch('commitState')
    commit('ADD_ELEMENT', { item, ports })
    dispatch('setItemPortPositions', item.id)
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

  /**
   * Deletes all selected items and connections.
   */
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
          .forEach(({ id }) => commit('REMOVE_CIRCUIT_NODE', id))
      } else {
        commit('REMOVE_CIRCUIT_NODE', i.id)
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
          .map(id => boundaries.getPointBoundary(state.ports[id].position))
      }

      if (item && !item.groupId) {
        // the item with the given id is an item that does not belong to a group
        if (item.type === 'Freeport') {
          if (item.portIds.length > 1) {
            // if only one port exists on the freeport, then it is a port being dragged by the user and does not apply
            // freeports should snap to "straighten out" wires
            return Object
              .values(state.connections)
              .reduce((boundingBoxes: BoundingBox[], connection: Connection) => {
                if (item.portIds.includes(connection.source)) {
                  return boundingBoxes.concat(boundaries.getLinearBoundaries(state.ports[connection.target].position))
                }

                if (item.portIds.includes(connection.target)) {
                  return boundingBoxes.concat(boundaries.getLinearBoundaries(state.ports[connection.source].position))
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

  deselectAll ({ commit }) {
    commit('SET_ALL_SELECTION_STATES', false)
  },

  selectAll ({ commit }) {
    commit('SET_ALL_SELECTION_STATES', true)
  },

  createSelection ({ commit, dispatch, state }, selection: BoundingBox) {
    if (!boundaries.isTwoDimensional(selection)) return // omit selection lines or points

    const itemIds = Object
      .keys(state.items)
      .filter(id => boundaries.hasIntersection(selection, state.items[id].boundingBox))
    const connectionIds = Object
      .keys(state.connections)
      .filter(id => {
        const connection = state.connections[id]
        const source = state.ports[connection.source]
        const target = state.ports[connection.target]
        const boundary = boundaries.getBoundaryByCorners(source.position, target.position)

        return boundaries.hasIntersection(selection, boundary)
      })

    itemIds
      .concat(connectionIds)
      .forEach(id => {
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
  },

  disconnect ({ commit }, { source, target }: { source: string, target: string }) {
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

  setPortValue ({ commit }, { id, value }: { id: string, value: number }) {
    commit('SET_PORT_VALUE', { id, value })
  },

  setActiveFreeportId ({ commit }, activeFreeportId: string) {
    commit('SET_ACTIVE_FREEPORT_ID', activeFreeportId)
  },

  /**
   * Removes a Freeport from the document.
   * This can remove either a dragged freeport or a connector between two wire segments.
   *
   * @param store
   * @param id - ID of the freeport item
   */
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
    commit('REMOVE_CIRCUIT_NODE', id)
    commit('REMOVE_ELEMENT', id)
  },

  /**
   * Creates a new freeport item with the given set of IDs in the payload.
   * This can either be a dragged port (to connect a port) or a joint between two connection segments.
   *
   * For a joint, include all required params, including the IDs of the destination ports and the freeport ports.
   * For a dragged port, include the source IDs (if dragged from an output) or the target IDs (if dragged from an input).
   *
   * @param store
   * @param data - IDs for apply the new freeport
   */
  createFreeport ({ commit, dispatch, state }, data: {
    itemId: string,
    outputPortId: string,
    inputPortId: string,
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
    commit('ADD_CIRCUIT_NODE', data.itemId)

    if (data.sourceId && data.targetId) {
      dispatch('disconnect', {
        source: data.sourceId,
        target: data.targetId
      })
    }

    if (data.sourceId) {
      dispatch('connect', {
        source: data.sourceId,
        target: data.inputPortId,
        connectionChainId: data.connectionChainId
      })
    }

    if (data.targetId) {
      dispatch('connect', {
        source: data.outputPortId,
        target: data.targetId,
        connectionChainId: data.connectionChainId
      })
    }
  },

  /**
   * Establishes a connection after a user drags a port to connect it to an item.
   * This will disconnect the temporary wire and port being dragged, and establish a new connection between the two items.
   *
   * @param store
   * @param payload
   * @param payload.sourceId - the ID of the source port (if being dragged from one)
   * @param payload.targetId - the ID of the target port (if being dragged from one)
   * @param payload.portId - the ID of the temporary freeport being dragged
   */
  connectFreeport ({ commit, dispatch, state }, { sourceId, targetId, portId }: { sourceId?: string, targetId?: string, portId: string }) {
    const port = state.ports[portId]
    const newPort = Object
      .values(state.ports)
      .find((p: Port) => {
        // TODO: make '10' a user-configurable number
        return boundaries.isInNeighborhood(p.position, port.position, 10) && p.id !== portId && state.connectablePortIds.includes(p.id)
      })

    if (newPort) {
      dispatch('commitState')

      if (sourceId) {
        dispatch('disconnect', {
          source: sourceId,
          target: portId
        })
        dispatch('connect', {
          source: sourceId,
          target: newPort.id
        })
      } else {
        dispatch('disconnect', {
          source: portId,
          target: targetId
        })
        dispatch('connect', {
          source: newPort.id,
          target: targetId
        })
      }
    }

    const item = Object
      .values(state.items)
      .find(({ portIds }) => portIds.includes(portId))

    if (item) {
      commit('REMOVE_CIRCUIT_NODE', item.id)
      commit('REMOVE_ELEMENT', item.id)
    }

    dispatch('setActiveFreeportId', null)
    commit('SET_CONNECTABLE_PORT_IDS', [])
  },

  /**
   * Sets the list of connectable port IDs.
   * This should be invoked whenever a user starts dragging a port.
   *
   * @param store
   * @param portId - the ID of the port being dragged
   */
  setConnectablePortIds ({ commit, state }, portId: string) {
    const port = state.ports[portId]

    if (port.isFreeport) return // freeports cannot connect to anything

    const connectedPortIds = Object
      .values(state.connections)
      .reduce((portIds: string[], connection: Connection) => {
        // if (state.ports[portId].isFreeport) { // TODO: probably not needed
        //   return portIds
        // }
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
}

export default actions
