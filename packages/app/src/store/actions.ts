import { ActionTree } from 'vuex'
import DocumentState from './DocumentState'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import SimulationService from '@/services/SimulationService'
import boundaries from '@/layout/boundaries'
import rotation from '@/layout/rotation'
import createIntegratedCircuit from '@/utils/createIntegratedCircuit'
import ItemType from '@/types/enums/ItemType'
import idMapper from '@/utils/idMapper'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

const actions: ActionTree<DocumentState, DocumentState> = {
  /**
   * Sets the zoom level for the document.
   *
   * @param store
   * @param zoom - percentage of zoom by decimal (e.g., 1.0 = 100%)
   */
  setZoom ({ commit }, zoom) {
    commit('SET_ZOOM', zoom)
  },

  loadDocument ({ commit, dispatch }, document: string) {
    commit('APPLY_STATE', document)
    dispatch('deselectAll')
  },

  saveIntegratedCircuit ({ state, commit }) {
    const { integratedCircuitItem, integratedCircuitPorts } = createIntegratedCircuit(state)

    commit('ADD_INTEGRATED_CIRCUIT', idMapper.mapIntegratedCircuitIds(integratedCircuitItem, integratedCircuitPorts))
  },

  buildCircuit ({ commit, state }) {
    const circuit = new SimulationService(Object.values(state.items), Object.values(state.connections), state.ports)

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

  /**
   * Reverts to the most-recently committed document state.
   *
   * @param store
   */
  undo ({ commit, state }) {
    const undoState = state.undoStack.slice(-1).pop()

    if (undoState) {
      commit('CACHE_STATE')
      commit('COMMIT_TO_REDO')
      commit('APPLY_STATE', undoState)
      commit('REMOVE_LAST_UNDO_STATE')
    }
  },

  /**
   * Reverts to the most-recently-reverted state.
   *
   * @param store
   */
  redo ({ commit, state }) {
    const redoState = state.redoStack.slice(-1).pop()

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
      .filter(({ isSelected, type }) => isSelected && type !== ItemType.Freeport)
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
      .forEach(({ id }) => dispatch('setSelectionState', { id, value: true }))

    // remove all selected connections
    Object
      .values(state.connections)
      .filter(({ isSelected }) => isSelected)
      .forEach(connection => {
        commit('DISCONNECT', {
          source: connection.source,
          target: connection.target
        })
      })

    // delete all selected non-freeport items
    nonFreeportItems.forEach(i => commit('REMOVE_ELEMENT', i.id))

    // handle selected freeport deletions using removeFreeport
    Object
      .values(state.items)
      .filter(({ isSelected, type }) => isSelected && type === ItemType.Freeport)
      .forEach(f => dispatch('removeFreeport', f.id))
  },

  /**
   * Sets the computed boundaries that an actively-dragged item to snap to.
   *
   * @param store
   * @param id - ID of the item being dragged
   */
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
        if (item.type === ItemType.Freeport) {
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
            .filter(e => e.id !== id && e.type !== ItemType.Freeport)
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

  /**
   * Sets the absolute positions for all ports that belong to the given item.
   *
   * @param store
   * @param id - ID of the item containing the ports
   */
  setItemPortPositions ({ commit, state }, id: string) {
    const item = state.items[id]

    if (!item) return

    const portGroups = item
      .portIds
      .reduce((portGroups: Map<Direction, Port[]>, portId) => {
        const port = state.ports[portId]

        if (port) {
          const index: Direction = rotation.rotate(port.orientation + item.rotation)

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
        commit('SET_PORT_POSITION', {
          id: port.id,
          position: rotation.getRotatedPortPosition(port, ports, item, index)
        })
      })
    }

    setPortGroupPositions(portGroups.get(Direction.Left))
    setPortGroupPositions(portGroups.get(Direction.Top))
    setPortGroupPositions(portGroups.get(Direction.Right))
    setPortGroupPositions(portGroups.get(Direction.Bottom))
  },

  /**
   * Sets the position of an item.
   *
   * @param store
   * @param payload
   * @param payload.id - ID of the item
   * @param payload.position - new position to move to
   */
  setItemPosition ({ commit, state }, { id, position }: { id: string, position: Point }) {
    const item = state.items[id]
    const delta: Point = {
      x: position.x - item.position.x,
      y: position.y - item.position.y
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

        commit('SET_PORT_POSITION', {
          id: portId,
          position: {
            x: port.position.x + delta.x,
            y: port.position.y + delta.y
          }
        })
      })
  },

  /**
   * Moves all selected items according to the delta provided.
   *
   * @param store
   * @param delta - delta to move the items by
   */
  moveSelectionPosition ({ dispatch, state }, delta: Point) {
    const id: string | undefined = state.selectedItemIds[0]

    if (id) {
      const item = state.items[id]
      const position: Point = {
        x: item.position.x + delta.x,
        y: item.position.y + delta.y
      }

      dispatch('commitState')
      dispatch('setSelectionPosition', { id, position })
    }
  },

  /**
   * Moves all selected items according to the delta that the given item has moved by.
   *
   * @param store
   * @param payload
   * @param payload.id - ID of the reference item moving
   * @param payload.position - new position that the reference item has moved to
   */
  setSelectionPosition ({ commit, dispatch, state }, { id, position }: { id: string, position: Point }) {
    const referenceItem = state.items[id]
    const delta: Point = {
      x: position.x - referenceItem.position.x,
      y: position.y - referenceItem.position.y
    }
    const groupIds = new Set<string>()

    state
      .selectedItemIds
      .forEach((itemId: string) => {
        const item = state.items[itemId]
        const position: Point = {
          x: item.position.x + delta.x,
          y: item.position.y + delta.y
        }

        if (item.groupId) {
          groupIds.add(item.groupId)
        }

        dispatch('setItemPosition', { id: itemId, position })
      })

    groupIds.forEach(groupId => {
      const group = state.groups[groupId]

      commit('SET_GROUP_BOUNDING_BOX', {
        boundingBox: {
          left: group.boundingBox.left + delta.x,
          top: group.boundingBox.top + delta.y,
          right: group.boundingBox.right +  delta.x,
          bottom: group.boundingBox.bottom + delta.y
        },
        id: groupId
      })
    })
  },

  /**
   * Sets the bounding box of an item.
   *
   * @param store
   * @param id - ID of the item
   */
  setItemBoundingBox ({ commit, state }, id: string) {
    const item = state.items[id]

    if (!item) return

    commit('SET_ELEMENT_BOUNDING_BOX', {
      id,
      boundingBox: boundaries.getItemBoundingBox(item)
    })
  },

  /**
   * Sets the bounding box of a group.
   *
   * @param store
   * @param id - ID of the group
   */
  setGroupBoundingBox ({ commit, state }, id: string) {
    if (!state.groups[id]) return

    const boundingBoxes = state
      .groups[id]
      .itemIds
      .map(id => state.items[id].boundingBox)

    commit('SET_GROUP_BOUNDING_BOX', {
      id,
      boundingBox: boundaries.getGroupBoundingBox(boundingBoxes)
    })
  },

  /**
   * Groups together all selected items and connections.
   * If any of those selected elements are a member of a group, that group will be destroyed.
   *
   * @param store
   */
  group ({ commit, dispatch, state }) {
    dispatch('commitState')

    const id = rand()
    const items = Object
      .values(state.items)
      .filter(({ isSelected }) => isSelected)
    const portIds = items.reduce((portIds, item) => {
      return portIds.concat(item.portIds)
    }, [] as string[])
    const connections = Object
      .values(state.connections)
      .filter(c => {
        // ensure both source and target ports are associated with items in the group
        return portIds.includes(c.source) && portIds.includes(c.target) && c.isSelected
      })

    // if any of the items or connections are part of another group, ungroup those
    items.forEach(i => i.groupId && commit('UNGROUP', i.groupId))
    connections.forEach(i => i.groupId && commit('UNGROUP', i.groupId))

    // update the zIndex of all items to be the highest one among the selected
    const zIndex = [...items, ...connections].reduce((zIndex: number, item: BaseItem) => {
      return Math.max(item.zIndex, zIndex)
    }, 0)

    commit('SET_Z_INDEX', zIndex)

    commit('GROUP_ITEMS', {
      id,
      itemIds: items.map(({ id }) => id),
      connectionIds: connections.map(({ id }) => id),
      isSelected: true
    })
    dispatch('setGroupBoundingBox', id)
  },

  /**
   * Destroys all selected groups.
   *
   * @param store
   */
  ungroup ({ commit, dispatch, state }) {
    dispatch('commitState')

    for (const id in state.groups) {
      if (state.groups[id].isSelected) {
        commit('UNGROUP', id)
      }
    }
  },

  /**
   * Clears the editor's actively-selected port ID.
   *
   * @param store
   */
  clearActivePortId ({ commit, state }) {
    const elementId = state.ports[state.activePortId || '']?.elementId

    if (elementId && !state.items[elementId]?.isSelected) {
      commit('SET_PREVIEW_CONNECTED_PORT_ID', null)
      commit('SET_ACTIVE_PORT_ID', null)
      commit('SET_SELECTED_PORT_INDEX', -1)
      commit('SET_CONNECTABLE_PORT_IDS', [])
    }
  },

  /**
   * Deselects all elements.
   *
   * @param store
   */
  deselectAll ({ commit, dispatch, state }) {
    if (state.previewConnectedPortId) {
      commit('COMMIT_CACHED_STATE')
    }

    commit('DESELECT_ALL')
    dispatch('clearActivePortId')
  },

  /**
   * Selects all elements.
   *
   * @param store
   */
  selectAll ({ commit }) {
    commit('SELECT_ALL')
  },

  /**
   * Selects all connections and items (and its connections) that live within the given boundary.
   *
   * @param store
   * @param selection - two-dimensional boundary
   */
  createSelection ({ commit, dispatch, state }, selection: BoundingBox) {
    if (!boundaries.isTwoDimensional(selection)) return // omit selection lines or points

    try {
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
    } catch (error) {
      console.log('SELECTION ERROR: ', error, selection)
      // TODO: this really shouldn't ever throw an error, investigate why it does...
      // do nothing, ignore the error
    }
  },

  /**
   * Selects all connections that are connected to any of the items in the given list.
   *
   * @param store
   * @param itemIds - list of items to select their connections for
   */
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

  /**
   * Inverts the selection state of the element having the given ID, or forces it to the value provided.
   * If the element is a member of a group, every item in that group will be selected.
   *
   * @param store
   * @param payload.id - the ID of the element to toggle its selection
   * @param payload.value - new selection state value to set to
   */
  setSelectionState ({ commit, state }, { id, value }: { id: string, value: boolean }) {
    const element = state.items[id] || state.connections[id]
    const isSelected = value

    if (!element || element.isSelected === isSelected) return

    if (element.groupId) {
      // if item is part of a group, select all items in that group
      const { itemIds, connectionIds } = state.groups[element.groupId]

      itemIds
        .concat(connectionIds)
        .forEach(id => {
          commit('SET_SELECTION_STATE', { id, isSelected })
        })

      commit('SET_SELECTION_STATE', { id: element.groupId, isSelected })
    } else {
      // otherwise, just select this one item
      commit('SET_SELECTION_STATE', { id, isSelected })
    }
  },

  /**
   * Establishes a 'preview' of a connection (i.e., not saved in the current document state).
   * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
   *
   * @note Unlike {@link `cycleDocumentPorts`}, this will NOT commit the connection to the state.
   * @param store
   * @param portId - the ID of the port previewing connections for
   */
  setConnectionPreview ({ commit, state }, portId: string | null) {
    if (state.activePortId && portId) {
      let source = state.activePortId
      let target = portId

      if (state.ports[state.activePortId].type === PortType.Input) {
        source = portId
        target = state.activePortId
      }

      if (portId === state.previewConnectedPortId) {
        commit('DISCONNECT', { source, target })
        commit('SET_PREVIEW_CONNECTED_PORT_ID', null)
      } else {
        commit('CONNECT', { source, target })
        commit('SET_PREVIEW_CONNECTED_PORT_ID', portId)
      }
    }
  },

  /**
   * Establishes a 'preview' of a connection (i.e., not saved in the current document state).
   * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
   *
   * @note Unlike {@link `setConnectionPreview`}, this WILL commit the connection to the state.
   * @param store
   * @param portId - the ID of the port previewing connections for
   */
  cycleDocumentPorts ({ commit, dispatch, state }, { portId, direction, clearConnection }: {
    portId: string,
    direction: number,
    clearConnection: boolean
  }) {
    if (portId && portId !== state.activePortId) {
      dispatch('setActivePortId', portId)
    }

    let index = state.selectedPortIndex + direction

    if (index < 0) index = 0
    if (index >= state.connectablePortIds.length) index = -1

    if (!state.cachedState) {
      commit('CACHE_STATE')
    }

    if (clearConnection) {
      dispatch('setConnectionPreview', state.previewConnectedPortId)
    } else {
      commit('COMMIT_CACHED_STATE')
      dispatch('setConnectablePortIds', { portId })
    }

    dispatch('setConnectionPreview', state.connectablePortIds[index])

    commit('SET_SELECTED_PORT_INDEX', index)
  },

  /**
   * Sets the ID of the active (i.e., 'previewed'/'enlarged') port.
   *
   * @param store
   * @param portId - ID of the port to activate, or null to remove it
   */
  setActivePortId ({ commit, dispatch, state }, portId: string | null) {
    if (state.activePortId !== portId) {
      if (portId) {
        dispatch('setConnectablePortIds', { portId })
      } else {
        commit('SET_CONNECTABLE_PORT_IDS', [])
      }

      commit('SET_ACTIVE_PORT_ID', portId)
      commit('SET_SELECTED_PORT_INDEX', -1)
    }
  },

  /**
   * Rotates all selected elements by 90 degrees.
   *
   * @param store
   * @param direction - direction of rotation (1 = CW, -1 = CCW)
   */
  rotate ({ commit, dispatch, state }, direction: number) {
    dispatch('commitState')

    const selectedItems = Object
      .values(state.items)
      .filter(({ isSelected }) => isSelected)
    const boundingBox = selectedItems.reduce((boundingBox: BoundingBox, item) => ({
      left: Math.min(item.boundingBox.left, boundingBox.left),
      top: Math.min(item.boundingBox.top, boundingBox.top),
      right: Math.max(item.boundingBox.right, boundingBox.right),
      bottom: Math.max(item.boundingBox.bottom, boundingBox.bottom)
    }), {
      left: Infinity,
      top: Infinity,
      right: 0,
      bottom: 0
    })
    const groupIds = new Set<string>()

    selectedItems.forEach(item => {
      if (item.groupId) {
        groupIds.add(item.groupId)
      }

      commit('ROTATE_ELEMENT', {
        id: item.id,
        rotation: rotation.rotate(item.rotation + direction)
      })
      dispatch('setItemPosition', {
        id: item.id,
        position: rotation.getGroupedItemRotatedPosition(boundingBox, item, direction)
      })
      dispatch('setItemBoundingBox', item.id)
      dispatch('setItemPortPositions', item.id)
    })

    groupIds.forEach(groupId => {
      dispatch('setGroupBoundingBox', groupId)
    })
  },

  sendBackward ({ commit }) {
    commit('INCREMENT_Z_INDEX', -1)
  },

  bringForward ({ commit }) {
    commit('INCREMENT_Z_INDEX', 1)
  },

  sendToBack ({ commit }) {
    commit('SET_Z_INDEX', 1)
  },

  bringToFront ({ commit, state }) {
    commit('SET_Z_INDEX', Object.keys(state.items).length)
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
  removeFreeport ({ commit, state }, id: string) {
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

    if (originalSourceId) commit('DISCONNECT', { source: originalSourceId, target: item.portIds[0] })
    if (originalTargetId) commit('DISCONNECT', { source: item.portIds[1], target: originalTargetId })
    if (originalSourceId && originalTargetId) {
      // reconnect the true source and target
      commit('CONNECT', { source: originalSourceId, target: originalTargetId })
    }

    // finally, remove the element
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

    if (data.sourceId && data.targetId) {
      commit('DISCONNECT', {
        source: data.sourceId,
        target: data.targetId
      })
    }

    if (data.sourceId) {
      commit('CONNECT', {
        source: data.sourceId,
        target: data.inputPortId,
        connectionChainId: data.connectionChainId
      })
    }

    if (data.targetId) {
      commit('CONNECT', {
        source: data.outputPortId,
        target: data.targetId,
        connectionChainId: data.connectionChainId
      })
    }

    if (data.sourceId && data.targetId) {
      // bring forward the freeport item so that it is between the two new connections
      dispatch('bringForward', data.itemId)
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
        commit('DISCONNECT', {
          source: sourceId,
          target: portId
        })
        commit('CONNECT', {
          source: sourceId,
          target: newPort.id
        })
      } else {
        commit('DISCONNECT', {
          source: portId,
          target: targetId
        })
        commit('CONNECT', {
          source: newPort.id,
          target: targetId
        })
      }
    } else {
      // no port can be connected, so disconnect the temporary dragged wire
      commit('DISCONNECT', {
        source: sourceId || portId,
        target: targetId || portId
      })
    }

    const item = Object
      .values(state.items)
      .find(({ portIds }) => portIds.includes(portId))

    if (item) {
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
  setConnectablePortIds ({ commit, state }, { portId, isDragging }: { portId: string, isDragging: boolean }) {
    const port = state.ports[portId]

    if (port.isFreeport) return // freeports cannot connect to anything

    // generate a list of all port IDs that have at least one connection to/from it
    const connectedPortIds = Object
      .values(state.connections)
      .reduce((portIds: string[], connection: Connection) => {
        return portIds.concat([connection.source, connection.target])
      }, [])

    if (isDragging) {
      // if this port is being dragged, then the user intents to establish a new connection with it
      // remove the last two ports (the two ports on opposite ends of the "preview" connection)
      connectedPortIds.splice(-2)
    }

    const filter = port.type === PortType.Output
      ? (p: Port) => p.type === PortType.Input && !p.isFreeport && !connectedPortIds.includes(p.id) && p.elementId !== port.elementId
      : (p: Port) => p.type === PortType.Output && !p.isFreeport && !connectedPortIds.includes(port.id) && p.elementId !== port.elementId

    commit('SET_CONNECTABLE_PORT_IDS', Object
      .values(state.ports)
      .filter(filter)
      .map(({ id }) => id))
  },

  /**
   * Adds the item having the given ID to the oscilloscope if the value is true, or removes it otherwise.
   *
   * @param store
   * @param payload
   * @param payload.id - item ID
   * @param payload.value
   */
  setOscilloscopeVisibility ({ commit }, { id, value }: { id: string, value: boolean }) {
    if (value) {
      commit('ADD_TO_OSCILLOSCOPE', id)
    } else {
      commit('REMOVE_FROM_OSCILLOSCOPE', id)
    }
  },

  /**
   * Sets the number of input ports that a LogicGate should have.
   * If the number is less than the current number of ports, take away the difference number of existing ports.
   *
   * @param store
   * @param payload
   * @param payload.id - LogicGate ID
   * @param payload.count - new number of input ports
   */
  setInputCount ({ commit, dispatch, state }, { id, count }: { id: string, count: number }) {
    const item = state.items[id]
    const oldCount = item.properties.inputCount.value as number

    if (oldCount > count) {
      // if the count has decreased, find the last remaining port IDs which will be removed
      state.items[id].portIds
        .filter(portId => state.ports[portId].type === PortType.Input)
        .slice(count)
        .forEach(portId => commit('REMOVE_PORT', portId))
    } else {
      for (let i = oldCount; i < count; i++) {
        // add the difference of ports one by one
        commit('ADD_PORT', {
          id: rand(),
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
        } as Port)
      }
    }

    dispatch('setItemPortPositions', id)
  },

  /**
   * Updates the properties values. If no properties have changed, then no changes will take effect.
   * This will perform any actions necessary to occur when a property value changes.
   *
   * @param store
   * @param payload
   * @param payload.id - item ID
   * @param payload.properties - new version of the properties
   */
  setProperties ({ commit, dispatch, state }, { id, properties }: { id: string, properties: PropertySet }) {
    const item = state.items[id]

    for (const propertyName in properties) {
      const property = properties[propertyName]

      if (item.properties[propertyName].value === property.value) {
        continue // do nothing if the property value has not changed
      }

      switch (propertyName) {
        case 'showInOscilloscope':
          dispatch('setOscilloscopeVisibility', { id, value: property.value })
          break
        case 'inputCount':
          dispatch('setInputCount', { id, count: property.value })
          break
      }

      commit('SET_ITEM_PROPERTY', { id, propertyName, value: property.value })
    }
  }
}

export default actions
