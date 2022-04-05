// @ts-check
import { defineStore, acceptHMRUpdate } from 'pinia'


import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import SimulationService from '@/services/SimulationService'
import boundaries from '@/layout/boundaries'
import rotation from '@/layout/rotation'
import createIntegratedCircuit from '@/utils/createIntegratedCircuit'
import ItemType from '@/types/enums/ItemType'
import idMapper from '@/utils/idMapper'

import getConnectionChain from '@/utils/getConnectionChain'
import ItemSubtype from '@/types/enums/ItemSubtype'
import sortByZIndex from '@/utils/sortByZIndex'
import DocumentState from './DocumentState'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

function generateItemName (item: Item, taxonomyCount: number) {
  const name: string[] = [item.type]

  if (item.subtype !== ItemSubtype.None) {
    name.push(item.subtype)
  }

  name.push(taxonomyCount.toString())

  return name.join(' ')
}

export const useDocumentStore = defineStore({
  id: 'user',
  state: (): DocumentState => ({
    cachedState: null,
    activeFreeportId: null,
    undoStack: [],
    redoStack: [],
    snapBoundaries: [],
    connectablePortIds: [],
    selectedConnectionIds: [],
    selectedItemIds: [],
    simulation: new SimulationService([], [], {}),
    waves: {
      waves: {},
      secondsElapsed: 0,
      secondsOffset: 0
    },
    items: {},
    connections: {},
    ports: {},
    groups: {},
    taxonomyCounts: {},
    zoomLevel: 1,
    selectedPortIndex: -1,
    zIndex: 1,
    activePortId: null,
    previewConnectedPortId: null
  }),


  getters: {

    zoom (state) {
      return state.zoomLevel
    },

    trueItems (state) {
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

    hasSelection (state) {
      return state.selectedItemIds.length > 0 || state.selectedConnectionIds.length > 0
    },

    hasSelectedItems (state) {
      return state.selectedItemIds.length > 0
    },

    selectedGroupIds (state) {
      const selectedGroupIds = new Set<string | null>()

      state
        .selectedItemIds
        .forEach(id => selectedGroupIds.add(state.items[id]?.groupId))

      return Array.from(selectedGroupIds)
    },

    canGroup () {
      return this.selectedGroupIds.length > 1 || this.selectedGroupIds[0] === null
    },

    canUngroup () {
      // return !!this.selectedGroupIds.find(id => !!id)
      return true // TODO
    },

    canUndo (state) {
      return state.undoStack.length > 0
    },

    canRedo (state) {
      return state.redoStack.length > 0
    }
  },

  actions: {

    /**
     * Sets the zoom level for the document.
     *
     * @param store
     * @param zoom - percentage of zoom by decimal (e.g., 1.0 = 100%)
     */
    setZoom (zoom) {
      this.SET_ZOOM(zoom)
    },

    loadDocument (document: string) {
      this.APPLY_STATE(document)
      this.deselectAll()
    },

    saveIntegratedCircuit () {
      const { integratedCircuitItem, integratedCircuitPorts } = createIntegratedCircuit(this.ports, this.items, this.connections)

      // TODO: typescript broken
      // this.ADD_INTEGRATED_CIRCUIT(idMapper.mapIntegratedCircuitIds(integratedCircuitItem, integratedCircuitPorts))
    },

    buildCircuit () {
      const circuit = new SimulationService(Object.values(this.items), Object.values(this.connections), this.ports)

      circuit.onChange((valueMap: any, wave: any) => {
        for (const portId in valueMap) {
          if (this.ports[portId]) {
            this.ports[portId].value = valueMap[portId]
          }
        }

        // this.waves = waves
      })

      this.simulation = circuit
    },

    addItem ({ item, ports }: { item: Item, ports: Port[] }) {
      this.commitState()
      this.ADD_ELEMENT({ item, ports })
      this.setItemPortPositions(item.id)
    },

    cacheState () {
      this.CACHE_STATE()
    },

    /**
     * Reverts to the most-recently committed document this.
     *
     * @param store
     */
    undo () {
      const undoState = this.undoStack.slice(-1).pop()

      if (undoState) {
        this.CACHE_STATE()
        this.COMMIT_TO_REDO()
        this.APPLY_STATE(undoState)
        this.undoStack.pop()
      }
    },

    /**
     * Reverts to the most-recently-reverted this.
     *
     * @param store
     */
    redo () {
      const redoState = this.redoStack.slice(-1).pop()

      if (redoState) {
        this.CACHE_STATE()
        this.COMMIT_TO_UNDO()
        this.APPLY_STATE(redoState)
        this.redoStack.pop()
      }
    },

    commitState () {
      this.CACHE_STATE()
      this.COMMIT_CACHED_STATE()
    },

    /**
     * Deletes all selected items and connections.
     */
    deleteSelection () {
      this.commitState()

      const nonFreeportItems = Object
        .values(this.items)
        .filter(({ isSelected, type }) => isSelected && type !== ItemType.Freeport)
      const nonFreeportItemIds = nonFreeportItems.map(({ id }) => id)

      // select the full chains of each connection attached to each selected item
      Object
        .values(this.connections)
        .filter(c => {
          const sourcePort = this.ports[c.source]
          const targetPort = this.ports[c.target]

          if (sourcePort && targetPort) {
            return nonFreeportItemIds.includes(sourcePort.elementId) ||
              nonFreeportItemIds.includes(targetPort.elementId)
          }
        })
        .forEach(({ id }) => this.setSelectionState({ id, value: true }))

      // remove all selected connections
      Object
        .values(this.connections)
        .filter(({ isSelected }) => isSelected)
        .forEach(connection => {
          this.DISCONNECT({
            source: connection.source,
            target: connection.target
          })
        })

      // delete all selected non-freeport items
      nonFreeportItems.forEach(i => this.REMOVE_ELEMENT(i.id))

      // handle selected freeport deletions using removeFreeport
      Object
        .values(this.items)
        .filter(({ isSelected, type }) => isSelected && type === ItemType.Freeport)
        .forEach(f => this.removeFreeport(f.id))
    },

    /**
     * Sets the computed boundaries that an actively-dragged item to snap to.
     *
     * @param store
     * @param id - ID of the item being dragged
     */
    setSnapBoundaries (id: string) {
      const snapBoundaries = ((): BoundingBox[] => {
        const item = this.items[id]

        if (this.connectablePortIds.length) {
          // if there are connectable port ids, then use those for boundaries
          return this
            .connectablePortIds
            .map(id => boundaries.getPointBoundary(this.ports[id].position))
        }

        if (item && !item.groupId) {
          // the item with the given id is an item that does not belong to a group
          if (item.type === ItemType.Freeport) {
            if (item.portIds.length > 1) {
              // if only one port exists on the freeport, then it is a port being dragged by the user and does not apply
              // freeports should snap to "straighten out" wires
              return Object
                .values(this.connections)
                .reduce((boundingBoxes: BoundingBox[], connection: Connection) => {
                  if (item.portIds.includes(connection.source)) {
                    return boundingBoxes.concat(boundaries.getLinearBoundaries(this.ports[connection.target].position))
                  }

                  if (item.portIds.includes(connection.target)) {
                    return boundingBoxes.concat(boundaries.getLinearBoundaries(this.ports[connection.source].position))
                  }

                  return boundingBoxes
                }, [])
            }
          } else {
            // this an item that can snap to align with the outer edge of any non-freeport item
            return Object
              .values(this.items)
              .filter(e => e.id !== id && e.type !== ItemType.Freeport)
              .map(e => e.boundingBox)
          }
        }
        return []
      })()

      this.snapBoundaries = snapBoundaries
    },

    setItemSize ({ rect, id }: { rect: DOMRectReadOnly, id: string }) {
      const item = this.items[id]

      if (!item) return

      // reposition w.r.t. the centroid
      const centerX = item.position.x + (item.width / 2)
      const centerY = item.position.y + (item.height / 2)
      const newX = centerX - (rect.width / 2)
      const newY = centerY - (rect.height / 2)

      this.items[id].position = {
        x: newX,
        y: newY
      }
      this.items[id].width = rect.width
      this.items[id].height = rect.height

      this.setItemBoundingBox(id)
      this.setItemPortPositions(id)

      if (this.items[id].groupId) {
        this.setGroupBoundingBox(this.items[id].groupId || '')
      }
    },

    /**
     * Sets the absolute positions for all ports that belong to the given item.
     *
     * @param store
     * @param id - ID of the item containing the ports
     */
    setItemPortPositions (id: string) {
      const item = this.items[id]

      if (!item) return

      const portGroups = item
        .portIds
        .reduce((portGroups: Map<Direction, Port[]>, portId) => {
          const port = this.ports[portId]

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
          this.ports[port.id].position = rotation.getRotatedPortPosition(port, ports, item, index)
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
    setItemPosition ({ id, position }: { id: string, position: Point }) {
      const item = this.items[id]
      const delta: Point = {
        x: position.x - item.position.x,
        y: position.y - item.position.y
      }

      this.COMMIT_CACHED_STATE()
      this.items[id].position = position
      this.items[id].boundingBox = {
        left: item.boundingBox.left + delta.x,
        top: item.boundingBox.top + delta.y,
        bottom: item.boundingBox.bottom + delta.y,
        right: item.boundingBox.right + delta.x
      }

      item
        .portIds
        .forEach(portId => {
          const port = this.ports[portId]

          this.ports[portId].position = {
            x: port.position.x + delta.x,
            y: port.position.y + delta.y
          }
        })
    },

    /**
     * Moves all selected items according to the delta provided.
     *
     * @param store
     * @param delta - delta to move the items by
     */
    moveSelectionPosition (delta: Point) {
      const id: string | undefined = this.selectedItemIds[0]

      if (id) {
        const item = this.items[id]
        const position: Point = {
          x: item.position.x + delta.x,
          y: item.position.y + delta.y
        }

        this.commitState()
        this.setSelectionPosition({ id, position })
      }
    },


    horribleFunction ({ id, position }: { id: string, position: Point }) {
      throw new Error('FAIL')
    },

    /**
     * Moves all selected items according to the delta that the given item has moved by.
     *
     * @param store
     * @param payload
     * @param payload.id - ID of the reference item moving
     * @param payload.position - new position that the reference item has moved to
     */
    setSelectionPosition ({ id, position }: { id: string, position: Point }) {
      const referenceItem = this.items[id]
      const delta: Point = {
        x: position.x - referenceItem.position.x,
        y: position.y - referenceItem.position.y
      }
      const groupIds = new Set<string>()

      this
        .selectedItemIds
        .forEach((itemId: string) => {
          const item = this.items[itemId]
          const position: Point = {
            x: item.position.x + delta.x,
            y: item.position.y + delta.y
          }

          if (item.groupId) {
            groupIds.add(item.groupId)
          }

          this.setItemPosition({ id: itemId, position })
        })

      groupIds.forEach(groupId => {
        const group = this.groups[groupId]

        this.groups[groupId].boundingBox = {
          left: group.boundingBox.left + delta.x,
          top: group.boundingBox.top + delta.y,
          right: group.boundingBox.right +  delta.x,
          bottom: group.boundingBox.bottom + delta.y
        }
      })
    },

    /**
     * Sets the bounding box of an item.
     *
     * @param store
     * @param id - ID of the item
     */
    setItemBoundingBox (id: string) {
      const item = this.items[id]

      if (!item) return

      this.items[id].boundingBox = boundaries.getItemBoundingBox(item)
    },

    /**
     * Sets the bounding box of a group.
     *
     * @param store
     * @param id - ID of the group
     */
    setGroupBoundingBox (id: string) {
      if (!this.groups[id]) return

      const boundingBoxes = this
        .groups[id]
        .itemIds
        .map(id => this.items[id].boundingBox)

      this.groups[id].boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)
    },

    /**
     * Groups together all selected items and connections.
     * If any of those selected elements are a member of a group, that group will be destroyed.
     *
     * @param store
     */
    group () {
      this.commitState()

      const id = rand()
      const items = Object
        .values(this.items)
        .filter(({ isSelected }) => isSelected)
      const portIds = items.reduce((portIds, item) => {
        return portIds.concat(item.portIds)
      }, [] as string[])
      const connections = Object
        .values(this.connections)
        .filter(c => {
          // ensure both source and target ports are associated with items in the group
          return portIds.includes(c.source) && portIds.includes(c.target) && c.isSelected
        })

      // if any of the items or connections are part of another group, ungroup those
      items.forEach(i => i.groupId && this.UNGROUP(i.groupId))
      connections.forEach(i => i.groupId && this.UNGROUP(i.groupId))

      // update the zIndex of all items to be the highest one among the selected
      const zIndex = [...items, ...connections].reduce((zIndex: number, item: BaseItem) => {
        return Math.max(item.zIndex, zIndex)
      }, 0)

      this.SET_Z_INDEX(zIndex)

      const group = {
        id,
        itemIds: items.map(({ id }) => id),
        connectionIds: connections.map(({ id }) => id),
        isSelected: true,
        boundingBox: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        },
        position: {
          x: 0, y: 0
        },
        zIndex
      }

      this.groups[id] = group

      // set the groupId of all items in the group
      group.itemIds.forEach(id => {
        this.items[id].groupId = group.id
      })

      // set the groupId of all connections in the group
      group.connectionIds.forEach(id => {
        this.connections[id].groupId = group.id
      })

      this.setGroupBoundingBox(id)
    },

    /**
     * Destroys all selected groups.
     *
     * @param store
     */
    ungroup () {
      this.commitState()

      for (const id in this.groups) {
        if (this.groups[id].isSelected) {
          this.UNGROUP(id)
        }
      }
    },

    /**
     * Clears the editor's actively-selected port ID.
     *
     * @param store
     */
    clearActivePortId () {
      const elementId = this.ports[this.activePortId || '']?.elementId

      if (elementId && !this.items[elementId]?.isSelected) {
        this.previewConnectedPortId = null
        this.activePortId = null
        this.selectedPortIndex = -1
        this.connectablePortIds = []
      }
    },

    /**
     * Deselects all elements.
     *
     * @param store
     */
    deselectAll () {
      if (this.previewConnectedPortId) {
        this.COMMIT_CACHED_STATE()
      }

      for (let id in this.connections) {
        this.connections[id].isSelected = false
        this.selectedConnectionIds = []
      }

      for (let id in this.items) {
        this.items[id].isSelected = false
        this.selectedItemIds.push(id)
        this.selectedItemIds = []
      }

      this.clearActivePortId()
    },

    /**
     * Selects all items and connections.
     *
     * @param store
     */
    selectAll () {
      this.selectedConnectionIds = []
      this.selectedItemIds = []

      for (let id in this.connections) {
        this.connections[id].isSelected = true
        this.selectedConnectionIds.push(id)
      }

      for (let id in this.items) {
        this.items[id].isSelected = true
        this.selectedItemIds.push(id)
      }
    },

    /**
     * Selects all connections and items (and its connections) that live within the given boundary.
     *
     * @param store
     * @param selection - two-dimensional boundary
     */
    createSelection (selection: BoundingBox) {
      if (!boundaries.isTwoDimensional(selection)) return // omit selection lines or points

      try {
        const itemIds = Object
          .keys(this.items)
          .filter(id => boundaries.hasIntersection(selection, this.items[id].boundingBox))
        const connectionIds = Object
          .keys(this.connections)
          .filter(id => {
            const connection = this.connections[id]
            const source = this.ports[connection.source]
            const target = this.ports[connection.target]
            const boundary = boundaries.getBoundaryByCorners(source.position, target.position)

            return boundaries.hasIntersection(selection, boundary)
          })

        itemIds
          .concat(connectionIds)
          .forEach(id => {
            this.SET_SELECTION_STATE({ id, isSelected: true })
          })

        this.selectItemConnections(itemIds)
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
    selectItemConnections (itemIds: string[]) {
      const portIds = itemIds.reduce((portIds: string[], itemId: string) => {
        return portIds.concat(this.items[itemId].portIds)
      }, [])

      for (let id in this.connections) {
        const c = this.connections[id]

        if (portIds.includes(c.source) || portIds.includes(c.target)) {
          this.SET_SELECTION_STATE({ id, isSelected: true })
        }
      }
    },

    /**
     * Inverts the selection this of the element having the given ID, or forces it to the value provided.
     * If the element is a member of a group, every item in that group will be selected.
     *
     * @param store
     * @param payload.id - the ID of the element to toggle its selection
     * @param payload.value - new selection this value to set to
     */
    setSelectionState ({ id, value }: { id: string, value: boolean }) {
      const element = this.items[id] || this.connections[id]
      const isSelected = value

      if (!element || element.isSelected === isSelected) return

      if (element.groupId) {
        // if item is part of a group, select all items in that group
        const { itemIds, connectionIds } = this.groups[element.groupId]

        itemIds
          .concat(connectionIds)
          .forEach(id => {
            this.SET_SELECTION_STATE({ id, isSelected })
          })

        this.SET_SELECTION_STATE({ id: element.groupId, isSelected })
      } else {
        // otherwise, just select this one item
        this.SET_SELECTION_STATE({ id, isSelected })
      }
    },

    /**
     * Establishes a 'preview' of a connection (i.e., not saved in the current document this).
     * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
     *
     * @note Unlike {@link `cycleDocumentPorts`}, this will NOT commit the connection to the this.
     * @param store
     * @param portId - the ID of the port previewing connections for
     */
    setConnectionPreview (portId: string | null) {
      if (this.activePortId && portId) {
        let source = this.activePortId
        let target = portId

        if (this.ports[this.activePortId].type === PortType.Input) {
          source = portId
          target = this.activePortId
        }

        if (portId === this.previewConnectedPortId) {
          this.DISCONNECT({ source, target })
          this.previewConnectedPortId = null
        } else {
          this.CONNECT({ source, target })
          this.previewConnectedPortId = portId
        }
      }
    },

    /**
     * Establishes a 'preview' of a connection (i.e., not saved in the current document this).
     * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
     *
     * @note Unlike {@link `setConnectionPreview`}, this WILL commit the connection to the this.
     * @param store
     * @param portId - the ID of the port previewing connections for
     */
    cycleDocumentPorts ({ portId, direction, clearConnection }: {
      portId: string,
      direction: number,
      clearConnection: boolean
    }) {
      if (portId && portId !== this.activePortId) {
        this.setActivePortId(portId)
      }

      let index = this.selectedPortIndex + direction

      if (index < 0) index = 0
      if (index >= this.connectablePortIds.length) index = -1

      if (!this.cachedState) {
        this.CACHE_STATE()
      }

      if (clearConnection) {
        this.setConnectionPreview(this.previewConnectedPortId)
      } else {
        this.COMMIT_CACHED_STATE()
        this.setConnectablePortIds({ portId })
      }

      this.setConnectionPreview(this.connectablePortIds[index])

      this.selectedPortIndex = index
    },

    /**
     * Sets the ID of the active (i.e., 'previewed'/'enlarged') port.
     *
     * @param store
     * @param portId - ID of the port to activate, or null to remove it
     */
    setActivePortId (portId: string | null) {
      if (this.activePortId !== portId) {
        if (portId) {
          this.setConnectablePortIds({ portId })
        } else {
          this.connectablePortIds = []
        }

        this.activePortId = portId
        this.selectedPortIndex = -1
      }
    },

    /**
     * Rotates all selected elements by 90 degrees.
     *
     * @param store
     * @param direction - direction of rotation (1 = CW, -1 = CCW)
     */
    rotate (direction: number) {
      this.commitState()

      const selectedItems = Object
        .values(this.items)
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
        const newRotation = rotation.rotate(item.rotation + direction)

        if (item.groupId) {
          groupIds.add(item.groupId)
        }

        this.items[item.id].rotation = newRotation
        this
          .items[item.id]
          .portIds
          .forEach(portId => {
            this.ports[portId].rotation = newRotation
          })

        this.setItemPosition({
          id: item.id,
          position: rotation.getGroupedItemRotatedPosition(boundingBox, item, direction)
        })
        this.setItemBoundingBox(item.id)
        this.setItemPortPositions(item.id)
      })

      groupIds.forEach(groupId => {
        this.setGroupBoundingBox(groupId)
      })
    },

    sendBackward () {
      this.INCREMENT_Z_INDEX(-1)
    },

    bringForward () {
      this.INCREMENT_Z_INDEX(1)
    },

    sendToBack () {
      this.SET_Z_INDEX(1)
    },

    bringToFront () {
      this.SET_Z_INDEX(Object.keys(this.items).length)
    },

    /**
     * Sets the value of the port in the circuit.
     *
     * @param this
     * @param payload.id - ID of the port
     * @param payload.value - new port value
     */
    setPortValue ({ id, value }: { id: string, value: number }) {
      this
        .simulation
        .setPortValue(id, value)
    },

    /**
     * Removes a Freeport from the document.
     * This can remove either a dragged freeport or a connector between two wire segments.
     *
     * @param store
     * @param id - ID of the freeport item
     */
    removeFreeport (id: string) {
      const item = this.items[id]

      let originalSourceId = ''
      let originalTargetId = ''

      // find the true source and target port ids
      Object
        .values(this.connections)
        .forEach(c => {
          if (c.target === item.portIds[0]) originalSourceId = c.source
          if (c.source === item.portIds[1]) originalTargetId = c.target
        })

      if (originalSourceId) this.DISCONNECT({ source: originalSourceId, target: item.portIds[0] })
      if (originalTargetId) this.DISCONNECT({ source: item.portIds[1], target: originalTargetId })
      if (originalSourceId && originalTargetId) {
        // reconnect the true source and target
        this.CONNECT({ source: originalSourceId, target: originalTargetId })
      }

      // finally, remove the element
      this.REMOVE_ELEMENT(id)
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
    createFreeport (data: {
      itemId: string,
      outputPortId: string,
      inputPortId: string,
      sourceId?: string,
      targetId?: string,
      connectionChainId?: string
    }) {
      if (this.items[data.itemId]) return

      if (data.sourceId && data.targetId) {
        this.commitState()
      }

      this.deselectAll()
      this.CREATE_FREEPORT_ELEMENT({
        ...data,
        position: {
          x: 0, y: 0
        }
      })
      this.setItemBoundingBox(data.itemId)
      this.activeFreeportId = data.itemId

      if (data.sourceId && data.targetId) {
        this.DISCONNECT({
          source: data.sourceId,
          target: data.targetId
        })
      }

      if (data.sourceId) {
        this.CONNECT({
          source: data.sourceId,
          target: data.inputPortId,
          connectionChainId: data.connectionChainId
        })
      }

      if (data.targetId) {
        this.CONNECT({
          source: data.outputPortId,
          target: data.targetId,
          connectionChainId: data.connectionChainId
        })
      }

      if (data.sourceId && data.targetId) {
        // bring forward the freeport item so that it is between the two new connections
        this.deselectAll()
        this.setSelectionState({
          id: data.itemId,
          value: true
        })
        this.bringForward()
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
    connectFreeport ({ sourceId, targetId, portId }: { sourceId?: string, targetId?: string, portId: string }) {
      const port = this.ports[portId]
      const newPort = Object
        .values(this.ports)
        .find((p: Port) => {
          // TODO: make '10' a user-configurable number
          return boundaries.isInNeighborhood(p.position, port.position, 10) && p.id !== portId && this.connectablePortIds.includes(p.id)
        })

      if (newPort) {
        this.commitState()

        if (sourceId) {
          this.DISCONNECT({
            source: sourceId,
            target: portId
          })
          this.CONNECT({
            source: sourceId,
            target: newPort.id
          })
        } else if (targetId) {
          this.DISCONNECT({
            source: portId,
            target: targetId
          })
          this.CONNECT({
            source: newPort.id,
            target: targetId
          })
        }
      } else {
        // no port can be connected, so disconnect the temporary dragged wire
        this.DISCONNECT({
          source: sourceId || portId,
          target: targetId || portId
        })
      }

      const item = Object
        .values(this.items)
        .find(({ portIds }) => portIds.includes(portId))

      if (item) {
        this.REMOVE_ELEMENT(item.id)
      }

      this.activeFreeportId = null
      this.connectablePortIds = []
    },

    /**
     * Sets the list of connectable port IDs.
     * This should be invoked whenever a user starts dragging a port.
     *
     * @param store
     * @param portId - the ID of the port being dragged
     */
    setConnectablePortIds ({ portId, isDragging }: { portId: string, isDragging?: boolean }) {
      const port = this.ports[portId]

      if (port.isFreeport) return // freeports cannot connect to anything

      // generate a list of all port IDs that have at least one connection to/from it
      const connectedPortIds = Object
        .values(this.connections)
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

      this.connectablePortIds = Object
        .values(this.ports)
        .filter(filter)
        .map(({ id }) => id)
    },

    /**
     * Adds the item having the given ID to the oscilloscope if the value is true, or removes it otherwise.
     *
     * @param store
     * @param payload
     * @param payload.id - item ID
     * @param payload.value
     */
    setOscilloscopeVisibility ({ id, value }: { id: string, value: boolean }) {
      if (value) {
        const item = this.items[id]
        const portType = item.type === ItemType.OutputNode
          ? PortType.Input // output elements (lightbulb, etc.) will monitor incoming port values
          : PortType.Output // all other elements will monitor the outgoing port values

        item
          .portIds
          .forEach(portId => {
            const port = this.ports[portId]

            if (port.type === portType) {
              this
                .simulation
                .monitorPort(portId, port.value)
            }
          })
      } else {
        const item = this.items[id]

        item
          .portIds
          .forEach(portId => {
            this
              .simulation
              .unmonitorPort(portId)
          })
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
    setInputCount ({ id, count }: { id: string, count: number }) {
      const item = this.items[id]
      const oldCount = item.properties.inputCount.value as number

      if (oldCount > count) {
        // if the count has decreased, find the last remaining port IDs which will be removed
        this.items[id].portIds
          .filter(portId => this.ports[portId].type === PortType.Input)
          .slice(count)
          .forEach(portId => this.REMOVE_PORT(portId))
      } else {
        for (let i = oldCount; i < count; i++) {
          // add the difference of ports one by one
          this.ADD_PORT({
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

      this.setItemPortPositions(id)
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
    setProperties ({ id, properties }: { id: string, properties: PropertySet }) {
      const item = this.items[id]

      for (const propertyName in properties) {
        const property = properties[propertyName]

        if (item.properties[propertyName].value === property.value) {
          continue // do nothing if the property value has not changed
        }

        switch (propertyName) {
          case 'showInOscilloscope':
            this.setOscilloscopeVisibility({ id, value: property.value as boolean })
            break
          case 'inputCount':
            this.setInputCount({ id, count: property.value as number })
            break
        }

        this.items[id].properties[propertyName].value = property.value
      }
    },

    setActiveFreeportId (id: string | null) {
      this.activeFreeportId = id
    },

    /**
     * Assigns values to the ports in the this according to the given map.
     *
     * @param this
     * @param valueMap - Port-ID-to-value mapping
     */
     SET_PORT_VALUES (valueMap: { [id: string]: number }) {
      for (const portId in valueMap) {
        if (this.ports[portId]) {
          this.ports[portId].value = valueMap[portId]
        }
      }
    },

    /**
     * Sets the current zoom level of the document.
     *
     * @param this
     * @param zoom - percentage as a decimal (e.g., 0.3 = 30%)
     */
    SET_ZOOM (zoom) {
      this.zoomLevel = zoom
    },

    /**
     * Stringifies and caches the current document this.
     * This will save all connections, items, ports, and groups.
     *
     * @param this
     */
    CACHE_STATE (this) {
      this.cachedState = JSON.stringify({
        connections: this.connections,
        items: this.items,
        ports: this.ports,
        groups: this.groups
      })
    },

    /**
     * Commits the actively-cached this to the undo stack.
     * This will clear the redo stack.
     *
     * @param this
     */
    COMMIT_CACHED_STATE () {
      if (this.cachedState) {
        this.undoStack.push(this.cachedState.toString())
        this.cachedState = null

        while (this.redoStack.length > 0) {
          this.redoStack.pop()
        }
      }
    },

    /**
     * Commits the actively-cached this to the redo stack.
     * This has the effect of setting a 'redo-able' action.
     *
     * @param this
     */
    COMMIT_TO_REDO () {
      if (this.cachedState) {
        this.redoStack.push(this.cachedState)
        this.cachedState = null
      }
    },

    /**
     * Commits the actively-cached this to the undo stack.
     * This has the effect of setting a 'undo-able' action.
     *
     * @param this
     */
    COMMIT_TO_UNDO () {
      if (this.cachedState) {
        this.undoStack.push(this.cachedState)
        this.cachedState = null
      }
    },

    /**
     * Applies the given serialized this to the active document.
     *
     * This this must contain exactly these maps: `items`, `connections`, `ports`, `groups`.
     * Any other properties will not be applied.
     *
     * @param this
     * @param savedState - JSON-serialized this string
     */
    APPLY_STATE (savedState: string) {
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

      // find all items and connections in current this that are not in the applied this and remove them from the circuit
      const removedItems = getExcludedMembers(this.items, items)
      const removedConnections = getExcludedMembers(this.connections, connections)

      // add any new items from the the applied this to the circuit
      const addedItems = getExcludedMembers(items, this.items)
      const addedConnections = getExcludedMembers(connections, this.connections)

      removedConnections.forEach(id => this.DISCONNECT(this.connections[id]))
      removedItems.forEach(id => this.REMOVE_ELEMENT(id))

      this.ports = ports
      this.items = items
      this.groups = groups

      addedItems.forEach(id => {
        if (items[id].integratedCircuit) {
          this.ADD_INTEGRATED_CIRCUIT({
            integratedCircuitItem: items[id],
            integratedCircuitPorts: ports
          })
        } else {
          this.ADD_ELEMENT({
            item: items[id],
            ports: Object.values(ports)
          })
        }
      })

      addedConnections.forEach(id => this.CONNECT(connections[id]))
    },

    /**
     * Assigns the given port to the this.
     *
     * @param this
     * @param port
     */
    ADD_PORT (port: Port) {
      this.ports[port.id] = port
      this.items[port.elementId].portIds.push(port.id)
    },

    /**
     * Removes a port from the this.
     * This will destroy the entire connection chain that it is a part of (if any).
     *
     * @param this
     * @param portId - ID of the port to destroy
     */
    REMOVE_PORT (portId: string) {
      // remove all connections associated with this port
      Object
        .values(this.connections)
        .filter(({ source, target }) => source === portId || target === portId)
        .forEach(c => {
          // find all segments and freeports of this connection and remove them
          const {
            connectionIds,
            freeportIds
          } = getConnectionChain(Object.values(this.connections), this.ports, c.connectionChainId)

          connectionIds.forEach(id => {
            // delete all connections associated with the chain
            const { source, target } = this.connections[id]

            this
              .simulation
              .removeConnection(source, target)

            delete this.connections[id]
          })

          freeportIds.forEach(id => {
            // delete all freeports associated with the chain
            this.items[id].portIds.forEach(portId => {
              delete this.ports[portId]
            })

            delete this.items[id]
          })
        })

      const port = this.ports[portId]

      if (port) {
        const item = this.items[port.elementId]

        // remove the reference to the port from the element
        const portIndex = item.portIds.findIndex(i => i === portId)

        if (portIndex !== -1) {
          this.items[item.id].portIds.splice(portIndex, 1)
        }

        delete this.ports[portId]
      }
    },

    /**
     * Adds any non-IC component to the this.
     *
     * @param this
     * @param payload
     * @param payload.item - new item to add
     * @param payload.ports - list of ports associated to the item
     */
    ADD_ELEMENT ({ item, ports }: { item: Item, ports: Port[] }) {
      ports.forEach(port => {
        this.ports[port.id] = port
      })

      const taxonomy = `${item.type}_${item.subtype}`

      if (!this.taxonomyCounts[taxonomy]) {
        this.taxonomyCounts[taxonomy] = 0
      }

      item.name = generateItemName(item, ++this.taxonomyCounts[taxonomy])

      this.items[item.id] = item
      this.items[item.id].zIndex = ++this.zIndex

      this
        .simulation
        .addNode(item, this.ports)
    },

    /**
     * Adds the given integrated circuit component to the this.
     *
     * @param this
     * @param payload
     * @param payload.integratedCircuitItem - the IC to add
     * @param payload.integratedCircuitPorts - ID-to-Port map of visibile IC ports to add
     */
    ADD_INTEGRATED_CIRCUIT ({ integratedCircuitItem, integratedCircuitPorts }: {
      integratedCircuitItem: Item,
      integratedCircuitPorts: { [id: string]: Port }
    }) {
      if (!integratedCircuitItem.integratedCircuit) return

      // assign the visible IC ports
      Object
        .values(integratedCircuitPorts)
        .forEach(port => {
          this.ports[port.id] = port
        })

      const taxonomy = `${integratedCircuitItem.type}_${integratedCircuitItem.subtype}`

      if (!this.taxonomyCounts[taxonomy]) {
        this.taxonomyCounts[taxonomy] = 0
      }

      this.items[integratedCircuitItem.id] = integratedCircuitItem
      this.items[integratedCircuitItem.id].name = generateItemName(integratedCircuitItem, ++this.taxonomyCounts[taxonomy])


      this
        .simulation
        .addIntegratedCircuit(integratedCircuitItem, integratedCircuitPorts)
    },

    /**
     * Removes an element and all its associated ports and circuit nodes from the this.
     *
     * @param this
     * @param id - ID of the item to remove
     */
    REMOVE_ELEMENT (id: string) {
      const item = this.items[id]

      if (item.integratedCircuit) {
        // remove all circuit nodes associated with the integrated circuit
        Object
          .values(item.integratedCircuit.items)
          .forEach(({ portIds }) => {
            this
              .simulation
              .removeNode(portIds)
          })
      } else {
        // remove the sole circuit node
        this
          .simulation
          .removeNode(item.portIds)
      }

      // remove all ports associated with the item
      item.portIds.forEach(portId => {
        delete this.ports[portId]
      })

      // remove the item
      delete this.items[id]
    },

    /**
     * Sets the selection this of the given element to the value provided.
     * If the item is a connection segment, then its entire connection chain will take on the same value.
     *
     * @param this
     * @param payload
     * @param payload.id - ID of the item, group, or connection to select
     * @param payload.isSelected - selection this to change to
     */
    SET_SELECTION_STATE ({ id, isSelected }: { id: string, isSelected: boolean }) {
      /**
       * Updates the selection list (selectedConnectionIds or selectedItemIds) according to the selection value.
       *
       * @private
       */
      const updateSelectionList = (id: string, key: 'selectedConnectionIds' | 'selectedItemIds') => {
        const index = this[key].findIndex((i: string) => i === id)

        if (isSelected && index === -1) {
          this[key].push(id)
        }

        if (!isSelected && index !== -1) {
          this[key].splice(index, 1)
        }
      }

      if (this.items[id]) {
        // select an individual item
        this.items[id].isSelected = isSelected
        updateSelectionList(id, 'selectedItemIds')
      } else if (this.connections[id]) {
        // select a connection (chain)
        const { connectionChainId } = this.connections[id]
        const {
          connectionIds,
          freeportIds
        } = getConnectionChain(Object.values(this.connections), this.ports, connectionChainId)

        // select all connection segments that are part of this connection chain
        connectionIds.forEach(id => {
          this.connections[id].isSelected = isSelected
          updateSelectionList(id, 'selectedConnectionIds')
        })

        // select all freeports that are part of this connection chain
        freeportIds.forEach(id => {
          this.items[id].isSelected = isSelected
          updateSelectionList(id, 'selectedItemIds')
        })
      }
    },

    /**
     * Increments the zIndex of all items selected.
     * If an item's movement collides with another item's movement, or it becomes out of bounds, its zIndex will not change.
     *
     * @param this
     * @param direction - 1 to increment, -1 to decrement
     */
    INCREMENT_Z_INDEX (direction: number) {
      const items: BaseItem[] = Object.values(this.items)
      const connections: BaseItem[] = Object.values(this.connections)
      const baseItems = items
        .concat(connections)
        .sort(sortByZIndex)
      const selectedItemIds = baseItems
        .filter(({ isSelected }) => isSelected)
        .map(({ id }) => id)

      if (direction > 0) {
        // if the direction is forward, then reverse the selected IDs
        // this is because the next item that an item may want to swap with may also be swapping (and therefore frozen)
        // reversing the order that we look at the items will prevent that from happening
        selectedItemIds.reverse()
      }

      const frozenIds: string[] = []

      selectedItemIds.forEach(id => {
        const currentIndex = baseItems.findIndex(i => i.id === id)
        const nextIndex = currentIndex + direction

        if (nextIndex < 0 || nextIndex >= baseItems.length) {
          // if the next zIndex pushes it out of bounds, freeze it
          frozenIds.push(baseItems[currentIndex].id)
          return
        }

        if (!frozenIds.includes(baseItems[nextIndex]?.id)) {
          const item = baseItems[currentIndex]
          // if the item to swap with is not frozen, then swap places with it
          baseItems.splice(currentIndex, 1)
          baseItems.splice(nextIndex, 0, item)
        }
      })

      baseItems.forEach((item, index) => {
        item.zIndex = index + 1
      })

      this.zIndex = Object.keys(baseItems).length
    },

    /**
     * Moves all selected items to the given zIndex values.
     * If those items aren't siblings already, they will be when this is invoked.
     *
     * @param this
     * @param zIndex - new zIndex to move items to
     */
    SET_Z_INDEX (zIndex: number) {
      const items: BaseItem[] = Object.values(this.items)
      const connections: BaseItem[] = Object.values(this.connections)
      let baseItems = items
        .concat(connections)
        .sort(sortByZIndex)
      const selectedItems = baseItems.filter(({ isSelected }) => isSelected)

      for (let i = 0; i < baseItems.length; i++) {
        if (baseItems[i].isSelected) {
          baseItems.splice(i, 1)
          i--
        }
      }

      baseItems.splice(zIndex - 1, 0, ...selectedItems)
      baseItems.forEach((item, index) => {
        item.zIndex = index + 1
      })

      this.zIndex = Object.keys(baseItems).length
    },

    /**
     * Establishes a new connection between two ports.
     *
     * @param this
     * @param payload
     * @param payload.source - source port ID
     * @param payload.target - target port ID
     * @param payload.connectionChainId - optional connection chain ID to add the connection segment to
     */
    CONNECT ({ source, target, connectionChainId }: { source?: string, target?: string, connectionChainId?: string }) {
      const id = `conn_${rand()}`

      if (source && target) {
        this.connections[id] = {
          id,
          source,
          target,
          connectionChainId: connectionChainId || id,
          groupId: null,
          zIndex: ++this.zIndex,
          isSelected: false
        }

        this.ports[source].connectedPortIds.push(target)
        this.ports[target].connectedPortIds.push(source)

        this
          .simulation
          .addConnection(source, target)
      }
    },

    /**
     * Disconnects two ports.
     *
     * @param this
     * @param payload
     * @param payload.source - source port ID
     * @param payload.target - target port ID
     */
    DISCONNECT ({ source, target }: { source: string, target: string }) {
      const connection = Object
        .values(this.connections)
        .find(c => c.source === source && c.target === target)

      if (connection) {
        this
          .simulation
          .removeConnection(source, target)

        const sourceIndex = this.ports[source].connectedPortIds.findIndex(id => id === source)
        const targetIndex = this.ports[target].connectedPortIds.findIndex(id => id === target)

        this.ports[source].connectedPortIds.splice(sourceIndex, 1)
        this.ports[target].connectedPortIds.splice(targetIndex, 1)

        delete this.connections[connection.id]
      }
    },

    /**
     * Destroys the group having the given ID.
     *
     * @param this
     * @param groupId
     */
    UNGROUP (groupId: string) {
      const group = this.groups[groupId]

      // remove the groupId of all items in the group and select them
      group.itemIds.forEach(id => {
        this.items[id].groupId = null
        this.selectedItemIds.push(id)
      })

      // remove the groupId of all connections in the group and select them
      group.connectionIds.forEach(id => {
        this.connections[id].groupId = null
        this.selectedConnectionIds.push(id)
      })

      delete this.groups[groupId]
    },

    /**
     * Adds a new freeport element. This can be used in either of two scenarios:
     *
     *  1. when a user is dragging a port to establish a connection to another port
     *  2. when a user drags on a connection to create a new "pivot point" on the wire
     *
     * @param this
     * @param payload
     * @param payload.itemId - desired ID for the new freeport
     * @param payload.inputPortId - the ID of the input port (omit for a wire drag from an output port)
     * @param payload.outputPortId - the ID of the output port (omit for a wire drag from an input port)
     * @param payload.position - the initial position of this port
     * @param payload.value - optional value of the port
     */
    CREATE_FREEPORT_ELEMENT ({ itemId, inputPortId, outputPortId, position, value }: {
      itemId: string
      position: Point
      outputPortId?: string
      inputPortId?: string
      value?: number
    }) {
      const createPort = (id: string, type: PortType, orientation: Direction): Port => ({
        id,
        type,
        name: '',
        elementId: itemId,
        orientation,
        isFreeport: true,
        position: {
          x: 0,
          y: 0
        },
        rotation: 0,
        value: value || 0,
        connectedPortIds: []
      })
      const portIds: string[] = []

      if (inputPortId) {
        this.ports[inputPortId] = createPort(inputPortId, PortType.Input, Direction.Right)
        portIds.push(inputPortId)
      }

      if (outputPortId) {
        this.ports[outputPortId] = createPort(outputPortId, PortType.Output, Direction.Left)
        portIds.push(outputPortId)
      }

      if (!this.taxonomyCounts[ItemType.Freeport]) {
        this.taxonomyCounts[ItemType.Freeport] = 0
      }

      this.items[itemId] = {
        id: itemId,
        name: '',
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
        zIndex: ++this.zIndex,
        width: 1,
        height: 1
      }
      this.items[itemId].name = generateItemName(this.items[itemId], ++this.taxonomyCounts[ItemType.Freeport])
      this.selectedItemIds.push(itemId)

      this
        .simulation
        .addNode(this.items[itemId], this.ports, true)
    }
  }
})
