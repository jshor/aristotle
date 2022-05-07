// @ts-check
import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import { LogicValue } from '@aristotle/circuit'

import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import SimulationService from '@/services/SimulationService'
import boundaries from '@/layout/boundaries'
import rotation from '@/layout/rotation'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'

import getConnectionChain from '@/utils/getConnectionChain'
import sortByZIndex from '@/utils/sortByZIndex'
import DocumentState from './DocumentState'
import integratedCircuitFactory from '@/factories/integratedCircuitFactory'
import idMapper from '@/utils/idMapper'
// import RemoteService from '@/services/RemoteService'

function generateItemName (item: Item, taxonomyCount: number) {
  const name: string[] = [item.type]

  if (item.subtype !== ItemSubtype.None) {
    name.push(item.subtype)
  }

  name.push(taxonomyCount.toString())

  return name.join(' ')
}

function fromDocumentToEditorCoordinates (canvas: BoundingBox, viewport: DOMRect, point: Point, z: number) {
  return {
    x: (point.x - viewport.x - canvas.left) / z,
    y: (point.y - viewport.y - canvas.top) / z
  }
}

const MIN_SCALE = 0.25

export const createDocumentStore = (id: string) => defineStore({
  id,
  state: (): DocumentState => ({
    undoStack: [],
    redoStack: [],
    simulation: new SimulationService([], [], {}),
    oscillogram: {},
    taxonomyCounts: {},
    zoomLevel: 1,
    zIndex: 1,
    isOscilloscopeEnabled: true,
    isCircuitEvaluated: false,
    isDebugging: false,
    isDirty: false,
    hasLoaded: false,

    /* canvas dimensions */
    viewport: new DOMRect(),
    canvas: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },

    /* the following variables are 'temporary' information */
    snapBoundaries: [],
    connectablePortIds: [],
    selectedConnectionIds: [],
    selectedItemIds: [],
    selectedPortIndex: -1,
    cachedState: null,
    activeFreeportId: null,
    activePortId: null,
    connectionPreviewId: null,

    /* serializable state items */
    items: {},
    connections: {},
    ports: {},
    groups: {},
  }),

  getters: {
    baseItems (state) {
      return (Object
        .values(state.connections) as BaseItem[])
        .concat(Object.values(state.items) as BaseItem[])
        .sort(sortByZIndex)
    },

    zoom (state) {
      return state.zoomLevel
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

    loadDocument (document: string) {
      this.buildCircuit()
      this.applyState(document)
      this.reset()
    },

    /**
     * Sets the zoom level for the document.
     *
     * @param zoom - percentage of zoom by decimal (e.g., 1.0 = 100%)
     */
    setZoom ({ zoom, point }: { zoom: number, point: Point }) {
      if (zoom < MIN_SCALE || zoom > 5) return

      const zoomedPoint = fromDocumentToEditorCoordinates(this.canvas, this.viewport, point, this.zoomLevel)
      const scaledPoint = { // the canvas coordinate, scaled by the new zoom factor
        x: zoomedPoint.x * zoom,
        y: zoomedPoint.y * zoom
      }
      const viewportPoint = { // the point w.r.t. the top left offset of the viewport
        x: point.x - this.viewport.x,
        y: point.y - this.viewport.y
      }

      this.panTo({
        x: Math.min(viewportPoint.x - scaledPoint.x, 0),
        y: Math.min(viewportPoint.y - scaledPoint.y, 0)
      })

      this.zoomLevel = zoom
    },

    setViewerSize (rect: DOMRect) {
      this.viewport = rect

      this.canvas.bottom = screen.height / MIN_SCALE
      this.canvas.right = screen.width / MIN_SCALE

      if (!this.hasLoaded && rect.width > 0 && rect.height > 0) {
        this.hasLoaded = true
        this.centerAll()
        this.panToCenter()
      }
    },

    panTo (pan: Point) {
      const deltaX = pan.x - this.canvas.left
      const deltaY = pan.y - this.canvas.top

      this.canvas.left += deltaX
      this.canvas.right += deltaX
      this.canvas.top += deltaY
      this.canvas.bottom += deltaY
    },

    panToCenter () {
      const midpoint = boundaries.getBoundingBoxMidpoint(this.canvas)

      this.panTo({
        x: (this.viewport.width / 2) - midpoint.x,
        y: (this.viewport.height / 2) - midpoint.y
      })
    },

    centerAll () {
      const boundingBoxes = Object
        .values(this.items)
        .map(({ boundingBox }) => boundingBox)
      const boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)
      const { x, y } = boundaries.getCenteredScreenPoint(this.canvas, boundingBox, 20) // TODO: make this configurable

      const deltaX = x - boundingBox.left
      const deltaY = y - boundingBox.top

      Object
        .values(this.items)
        .forEach(item => {
          this.setItemPosition({
            id: item.id,
            position: {
              x: item.position.x + deltaX,
              y: item.position.y + deltaY
            }
          })
          this.setItemPortPositions(item.id)
        })
    },

    async saveIntegratedCircuit () {
      // TODO: this action should live in the root state, not here
      const originalIcItem = integratedCircuitFactory(this.$state as DocumentState)
      const idMappedIcItem = idMapper.mapIntegratedCircuitIds(originalIcItem)

      // RemoteService.showMessageBox({ message: 'Integrated circuit saved!', type: 'info' })

      // save file
      // const file = JSON.stringify(this.$state)
      this.addIntegratedCircuit(idMappedIcItem)
    },

    buildCircuit () {
      if (this.simulation.oscillator) {
        this.simulation.oscillator.stop()
      }

      const simulation = new SimulationService(Object.values(this.items), Object.values(this.connections), this.ports)

      simulation.on('change', (valueMap: Record<string, number>, oscillogram: Oscillogram) => {
        for (const portId in valueMap) {
          if (this.ports[portId]) {
            this.ports[portId].value = valueMap[portId]
          }
        }

        this.isCircuitEvaluated = !this.simulation.canContinue
        this.oscillogram = oscillogram
      })

      this.simulation = simulation
    },

    recycleSelection (backToFirstItem: boolean) {
      const id = backToFirstItem
        ? this.baseItems[0]
        : this.baseItems.slice(-1)[0]

      if (id) {
        this.deselectAll()
        this.setSelectionState({ id: id.id, value: true })
      }
    },

    insertItem ({ item, ports }: { item: Item, ports: Port[] }, documentPosition: Point | null = null) {
      if (!documentPosition) {
        const viewportMidpoint = boundaries.getBoundingBoxMidpoint(this.viewport)

        documentPosition = fromDocumentToEditorCoordinates(this.canvas, this.viewport, viewportMidpoint, this.zoomLevel)
      }

      this.commitState()
      this.addNewItem({ item, ports })

      const position = fromDocumentToEditorCoordinates(this.canvas, this.viewport, documentPosition, this.zoomLevel)

      this.setItemPosition({ id: item.id, position })
      this.setItemPortPositions(item.id)
      this.setSelectionState({ id: item.id, value: true })
    },

    /**
     * Reverts to the most-recently committed document this.
     */
    undo () {
      const undoState = this.undoStack.slice(-1).pop()

      if (undoState) {
        this.redoStack.push(JSON.stringify({
          connections: this.connections,
          items: this.items,
          ports: this.ports,
          groups: this.groups
        }))
        this.applyState(undoState)
        this.undoStack.pop()
        this.isDirty = true
      }
    },

    /**
     * Reverts to the most-recently-reverted this.
     */
    redo () {
      const redoState = this.redoStack.slice(-1).pop()

      if (redoState) {
        this.undoStack.push(JSON.stringify({
          connections: this.connections,
          items: this.items,
          ports: this.ports,
          groups: this.groups
        }))
        this.applyState(redoState)
        this.redoStack.pop()
        this.isDirty = true
      }
    },

    commitState () {
      this.cacheState()
      this.commitCachedState()
    },

    /**
     * Deletes all selected items and connections.
     */
    deleteSelection () {
      if (!this.hasSelection) return

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
          this.disconnect({
            source: connection.source,
            target: connection.target
          })
        })

      // delete all selected non-freeport items
      nonFreeportItems.forEach(i => this.removeElement(i.id))

      // handle selected freeport deletions using removeFreeport
      Object
        .values(this.items)
        .filter(({ isSelected, type }) => isSelected && type === ItemType.Freeport)
        .forEach(f => this.removeFreeport(f.id))
    },

    /**
     * Sets the computed boundaries that an actively-dragged item to snap to.
     *
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

    /**
     * Moves all selected items according to the delta that the given item has moved by.
     *
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

      this.setSelectionState({ id, value: true })

      if (referenceItem.type === ItemType.Freeport) {
        // if this item is a freeport, drag only this and nothing else
        return this.setItemPosition({ id, position })
      }

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
     */
    group () {
      this.commitState()

      const id = uuid()
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
      items.forEach(i => i.groupId && this.destroyGroup(i.groupId))
      connections.forEach(i => i.groupId && this.destroyGroup(i.groupId))

      // update the zIndex of all items to be the highest one among the selected
      const zIndex = [...items, ...connections].reduce((zIndex: number, item: BaseItem) => {
        return Math.max(item.zIndex, zIndex)
      }, 0)

      this.setZIndex(zIndex)

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
     */
    ungroup () {
      this.commitState()

      for (const id in this.groups) {
        if (this.groups[id].isSelected) {
          this.destroyGroup(id)
        }
      }
    },

    /**
     * Deselects all elements.
     *
     */
    deselectAll () {
      this.clearStatelessInfo()

      for (let id in this.connections) {
        this.connections[id].isSelected = false
        this.selectedConnectionIds = []
      }

      for (let id in this.items) {
        this.items[id].isSelected = false
        this.selectedItemIds.push(id)
        this.selectedItemIds = []
      }
    },

    /**
     * Selects all items and connections.
     *
     */
    selectAll () {
      this.clearStatelessInfo()

      for (let id in this.connections) {
        this.connections[id].isSelected = true
        this.selectedConnectionIds.push(id)
      }

      for (let id in this.items) {
        this.items[id].isSelected = true
        this.selectedItemIds.push(id)
      }
    },

    clearStatelessInfo () {
      this.unsetConnectionPreview()
      this.snapBoundaries = []
      this.connectablePortIds = []
      this.selectedConnectionIds = []
      this.selectedItemIds = []
      this.selectedPortIndex = -1
      this.cachedState = null
      this.activePortId = null
      this.connectionPreviewId = null
    },

    /**
     * Selects all connections and items (and its connections) that live within the given boundary.
     *
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

            return boundaries.isLineIntersectingRectangle(source.position, target.position, selection)
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
     * @param itemIds - list of items to select their connections for
     */
    selectItemConnections (itemIds: string[]) {
      const portIds = itemIds.reduce((portIds: string[], itemId: string) => {
        return portIds.concat(this.items[itemId].portIds)
      }, [])

      for (let id in this.connections) {
        const c = this.connections[id]

        if (portIds.includes(c.source) && portIds.includes(c.target)) {
          this.SET_SELECTION_STATE({ id, isSelected: true })
        }
      }
    },

    /**
     * Inverts the selection this of the element having the given ID, or forces it to the value provided.
     * If the element is a member of a group, every item in that group will be selected.
     *
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

    deselectItem (id: string) {
      this.setSelectionState({ id, value: true })
    },

    selectItem (id: string, keepSelection: boolean = false) {
      console.log('KEEP? ', keepSelection)
      if (!keepSelection) {
        this.deselectAll()
      }

      this.setSelectionState({ id, value: true })
    },

    /**
     * Establishes a 'preview' of a connection (i.e., not saved in the current document this).
     * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
     *
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

        const id = uuid()

        this.unsetConnectionPreview()
        this.connect({ source, target, id })
        this.connectionPreviewId = id
      }
    },

    /**
     * Clears the active connection preview.
     */
    unsetConnectionPreview () {
      if (this.connectionPreviewId) {
        this.disconnect(this.connections[this.connectionPreviewId])
      }
      this.connectionPreviewId = null
    },

    /**
     * Commits the previewed connection action as an undo-able state.
     */
    commitPreviewedConnection () {
      if (this.connectionPreviewId) {
        const { source, target } = this.connections[this.connectionPreviewId]

        this.disconnect({ source, target })
        this.commitState()
        this.connect({ source, target })
        this.connectionPreviewId = null
      }
    },

    /**
     * Establishes a 'preview' of a connection (i.e., not saved in the current document this).
     * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
     *
     * @param portId - the ID of the port previewing connections for
     */
    cycleConnectionPreviews (portId: string) {
      if (portId && portId !== this.activePortId) {
        this.setActivePortId(portId)
      }

      let index = this.selectedPortIndex + 1

      if (index <= 0) index = 0
      if (index >= this.connectablePortIds.length) index = -1

      const previewPortId = this.connectablePortIds[index]

      if (previewPortId && !this.ports[portId]?.connectedPortIds.includes(previewPortId)) {
        this.setConnectionPreview(previewPortId)
      } else {
        if (this.connectablePortIds.length === 0) {
          window.api.beep() // audibly inform the user they can't connect to anything
        }
        this.unsetConnectionPreview()
      }
      this.selectedPortIndex = index
    },

    /**
     * Sets the ID of the active (i.e., 'previewed'/'enlarged') port.
     *
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

    /**
     * Sets the value of the port in the circuit.
     *
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

      if (originalSourceId) this.disconnect({ source: originalSourceId, target: item.portIds[0] })
      if (originalTargetId) this.disconnect({ source: item.portIds[1], target: originalTargetId })
      if (originalSourceId && originalTargetId) {
        // reconnect the true source and target
        this.connect({ source: originalSourceId, target: originalTargetId })
      }

      // finally, remove the element
      this.removeElement(id)
    },

    /**
     * Creates a new freeport item with the given set of IDs in the payload.
     * This can either be a dragged port (to connect a port) or a joint between two connection segments.
     *
     * For a joint, include all required params, including the IDs of the destination ports and the freeport ports.
     * For a dragged port, include the source IDs (if dragged from an output) or the target IDs (if dragged from an input).
     *
     * @param data - IDs for apply the new freeport
     */
    createFreeport (data: {
      itemId: string,
      outputPortId: string,
      inputPortId: string,
      sourceId?: string,
      targetId?: string,
      connectionChainId?: string,
      position: Point
    }) {
      if (this.items[data.itemId]) return

      if (data.sourceId && data.targetId) {
        this.commitState()
      }

      this.deselectAll()
      this.addFreeportItem(data)
      this.setItemBoundingBox(data.itemId)
      this.activeFreeportId = data.itemId

      if (data.sourceId && data.targetId) {
        this.disconnect({
          source: data.sourceId,
          target: data.targetId
        })
      }

      if (data.sourceId) {
        this.connect({
          source: data.sourceId,
          target: data.inputPortId,
          connectionChainId: data.connectionChainId
        })
      }

      if (data.targetId) {
        this.connect({
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
        this.incrementZIndex(1)
      }
    },

    /**
     * Establishes a connection after a user drags a port to connect it to an item.
     * This will disconnect the temporary wire and port being dragged, and establish a new connection between the two items.
     *
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
        if (sourceId) {
          this.disconnect({
            source: sourceId,
            target: portId
          })
          this.connect({
            source: sourceId,
            target: newPort.id
          })
        } else if (targetId) {
          this.disconnect({
            source: portId,
            target: targetId
          })
          this.connect({
            source: newPort.id,
            target: targetId
          })
        }
      } else {
        // no port can be connected, so disconnect the temporary dragged wire
        this.disconnect({
          source: sourceId || portId,
          target: targetId || portId
        })
      }

      const item = Object
        .values(this.items)
        .find(({ portIds }) => portIds.includes(portId))

      if (item) {
        this.removeElement(item.id)
      }

      this.clearStatelessInfo()
    },

    /**
     * Sets the list of connectable port IDs.
     * This should be invoked whenever a user starts dragging a port.
     *
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

    stop () {
      this.simulation.pause()
    },

    start () {
      if (!this.isDebugging) {
        this.simulation.unpause()
      }
    },

    reset () {
      this.buildCircuit()
      this.simulation.isPaused = this.isDebugging
      this.oscillogram = {}
      this.simulation.oscillogram = {}

      Object
        .values(this.items)
        .forEach(item => {
          item.portIds.forEach(id => {
            this.ports[id].value = LogicValue.UNKNOWN

            if (item.properties?.startValue && this.ports[id].type === PortType.Output) {
              this.setPortValue({
                id,
                value: item.properties?.startValue.value as number
              })
            }
          })
        })

      this.simulation.unpause()
    },

    toggleDebugger () {
      if (this.isDebugging) {
        this.simulation.stopDebugging()
      } else {
        this.simulation.startDebugging()
      }

      this.isDebugging = !this.isDebugging
    },

    stepThroughCircuit () {
      this.simulation.advance()
      this.isCircuitEvaluated = !this.simulation.canContinue
    },

    toggleOscilloscope () {
      if (this.isOscilloscopeEnabled) {
        this.disableOscilloscope()
      } else {
        this.enableOscilloscope()
      }
    },

    enableOscilloscope () {
      Object
        .values(this.items)
        .forEach(item => this.simulation.monitorNode(item, this.ports))

      this.isOscilloscopeEnabled = true
    },

    disableOscilloscope () {
      Object
        .values(this.items)
        .forEach(({ portIds }) => {
          portIds.forEach(this.simulation.unmonitorPort)
        })

      this.oscillogram = {}
      this.simulation.oscillogram = {}
      this.isOscilloscopeEnabled = false
    },

    clearOscilloscope () {
      this.simulation.oscillator.clear()
    },

    /**
     * Adds the item having the given ID to the oscilloscope if the value is true, or removes it otherwise.
     *
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
          .forEach(portId => this.removePort(portId))
      } else {
        for (let i = oldCount; i < count; i++) {
          const portId = uuid()

          // add the difference of ports one by one
          this.addPort(id, {
            id: portId,
            name: '', // TODO
            connectedPortIds: [],
            type: PortType.Input,
            elementId: id,
            virtualElementId: id,
            orientation: Direction.Left,
            isFreeport: false,
            position: {
              x: 0,
              y: 0
            },
            rotation: 0,
            value: 0
          })
        }
      }
    },

    /**
     * Updates the properties values. If no properties have changed, then no changes will take effect.
     * This will perform any actions necessary to occur when a property value changes.
     *
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

    /**
     * Assigns values to the ports in the this according to the given map.
     *
     * @param valueMap - Port-ID-to-value mapping
     */
    setPortValues (valueMap: Record<string, number>) {
      for (const portId in valueMap) {
        if (this.ports[portId]) {
          this.ports[portId].value = valueMap[portId]
        }
      }
    },

    /**
     * Stringifies and caches the current document this.
     * This will save all connections, items, ports, and groups.
     *
     */
    cacheState (this) {
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
     */
    commitCachedState () {
      if (this.cachedState) {
        this.undoStack.push(this.cachedState.toString())
        this.cachedState = null
        this.redoStack = []
        this.isDirty = true
      }
    },

    /**
     * Applies the given serialized this to the active document.
     *
     * This this must contain exactly these maps: `items`, `connections`, `ports`, `groups`.
     * Any other properties will not be applied.
     *
     * @param savedState - JSON-serialized this string
     */
    applyState (savedState: string) {
      const parsedState = JSON.parse(savedState) as DocumentState
      const { items, connections, ports, groups } = parsedState

      /* returns everything in a that is not in b */
      function getExcludedMembers (a: Record<string, BaseItem>, b: Record<string, BaseItem>) {
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

      removedConnections.forEach(id => this.disconnect(this.connections[id]))
      removedItems.forEach(id => this.removeElement(id))

      this.ports = ports
      this.items = items
      this.groups = groups

      addedItems.forEach(id => {
        if (items[id].integratedCircuit) {
          this.addIntegratedCircuit(items[id])
        } else {
          this.addNewItem({
            item: items[id],
            ports: Object.values(ports)
          })
        }
      })

      addedConnections.forEach(id => this.connect(connections[id]))

      this.simulation.step()
    },

    addPort (itemId: string, port: Port) {
      const nodeId = Object
        .keys(this.simulation.nodes)
        .find(id => this.items[itemId].portIds.includes(id))

      this.ports[port.id] = port
      this.items[itemId].portIds.push(port.id)

      if (nodeId) {
        this.simulation.addSiblingPort(port.id, nodeId)
      } else {
        this.simulation.addNode(this.items[itemId], this.ports)
      }
    },

    /**
     * Removes a port from the state.
     * This will destroy the entire connection chain that it is a part of (if any).
     *
     * @param portId - ID of the port to destroy
     */
    removePort (portId: string) {
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
              this.simulation.removePort(portId)
            })

            delete this.items[id]
          })
        })

      const port = this.ports[portId]

      if (port) {
        const item = this.items[port.elementId]

        if (!item) return

        // remove the reference to the port from the element
        const portIndex = item.portIds.findIndex(i => i === portId)

        if (portIndex !== -1) {
          this.items[item.id].portIds.splice(portIndex, 1)
        }

        delete this.ports[portId]
        this.simulation.removePort(portId)
      }
    },

    /**
     * Adds any non-IC component to the this.
     *
     * @param payload
     * @param payload.item - new item to add
     * @param payload.ports - list of ports associated to the item
     */
    addNewItem ({ item, ports }: { item: Item, ports: Port[] }) {
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

      this.resetItemValue(item)
    },

    resetItemValue (item: Item) {
      const property = item.properties?.startValue

      if (!property) return

      const value = property.value as number

      item.portIds.forEach(id => this.setPortValue({ id, value }))
    },

    /**
     * Adds the given integrated circuit component to the this.
     *
     * @param {Item} integratedCircuitItem
     */
    addIntegratedCircuit (integratedCircuitItem: Item) {
      const { integratedCircuit } = integratedCircuitItem

      if (!integratedCircuit) return

      // assign the visible IC ports
      integratedCircuitItem
        .portIds
        .forEach(portId => {
          if (integratedCircuit.ports[portId]) {
            this.ports[portId] = integratedCircuit.ports[portId]
          }
        })

      const taxonomy = `${integratedCircuitItem.type}_${integratedCircuitItem.subtype}`

      if (!this.taxonomyCounts[taxonomy]) {
        this.taxonomyCounts[taxonomy] = 0
      }

      this.items[integratedCircuitItem.id] = integratedCircuitItem
      this.items[integratedCircuitItem.id].name = generateItemName(integratedCircuitItem, ++this.taxonomyCounts[taxonomy])

      this
        .simulation
        .addIntegratedCircuit(integratedCircuitItem)
    },

    /**
     * Removes an element and all its associated ports and circuit nodes from the state.
     *
     * @param id - ID of the item to remove
     */
    removeElement (id: string) {
      const item = this.items[id]

      this
        .simulation
        .removeNode(item)

      // remove all ports associated with the item
      item.portIds.forEach(portId => this.removePort(portId))

      // remove the item
      delete this.items[id]
    },

    /**
     * Sets the selection this of the given element to the value provided.
     * If the item is a connection segment, then its entire connection chain will take on the same value.
     *
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

    sendBackward () {
      this.commitState()
      this.incrementZIndex(-1)
    },

    bringForward () {
      this.commitState()
      this.incrementZIndex(1)
    },

    sendToBack () {
      this.commitState()
      this.setZIndex(1)
    },

    bringToFront () {
      this.commitState()
      this.setZIndex(this.zIndex)
    },

    /**
     * Increments the zIndex of all items selected.
     * If an item's movement collides with another item's movement, or it becomes out of bounds, its zIndex will not change.
     *
     * @param direction - 1 to increment, -1 to decrement
     */
    incrementZIndex (direction: number) {
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
     * @param zIndex - new zIndex to move items to
     */
    setZIndex (zIndex: number) {
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
     * @param payload
     * @param payload.source - source port ID
     * @param payload.target - target port ID
     * @param payload.connectionChainId - optional connection chain ID to add the connection segment to
     */
    connect ({ source, target, connectionChainId, id = uuid() }: { source?: string, target?: string, connectionChainId?: string, id?: string }) {
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
     * @param payload
     * @param payload.source - source port ID
     * @param payload.target - target port ID
     */
    disconnect ({ source, target }: { source: string, target: string }) {
      const connection = Object
        .values(this.connections)
        .find(c => c.source === source && c.target === target)

      if (connection) {
        this
          .simulation
          .removeConnection(source, target)

        const sourceIndex = this.ports[source].connectedPortIds.findIndex(id => id === target)
        const targetIndex = this.ports[target].connectedPortIds.findIndex(id => id === source)

        this.ports[source].connectedPortIds.splice(sourceIndex, 1)
        this.ports[target].connectedPortIds.splice(targetIndex, 1)

        delete this.connections[connection.id]
      }
    },

    /**
     * Destroys the group having the given ID.
     *
     * @param groupId
     */
    destroyGroup (groupId: string) {
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
     * @param payload
     * @param payload.itemId - desired ID for the new freeport
     * @param payload.inputPortId - the ID of the input port (omit for a wire drag from an output port)
     * @param payload.outputPortId - the ID of the output port (omit for a wire drag from an input port)
     * @param payload.position - the initial position of this port
     * @param payload.value - optional value of the port
     */
    addFreeportItem ({ itemId, inputPortId, outputPortId, position, value }: {
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
        isSelected: false,
        groupId: null,
        zIndex: ++this.zIndex,
        width: 1,
        height: 1
      }
      this.items[itemId].name = generateItemName(this.items[itemId], ++this.taxonomyCounts[ItemType.Freeport])

      this
        .simulation
        .addNode(this.items[itemId], this.ports, true)
    },

    cut () {
      this.copy()
      this.deleteSelection()
    },

    copy () {
      if (!this.hasSelection) return

      const items: Record<string, Item> = {}
      const ports: Record<string, Port> = {}

      this.selectedItemIds.forEach(id => {
        items[id] = this.items[id]
        items[id].portIds.forEach(portId => {
          ports[portId] = this.ports[portId]
        })
      })

      const connections = Object
        .values(this.connections)
        .reduce((map, connection) => {
          if (ports[connection.source] && ports[connection.target]) {
            map[connection.id] = connection
          }

          return map
        }, {})

      const groups = Object
        .values(this.groups)
        .filter(({ isSelected }) => isSelected)
        .reduce((map, group) => ({ ...map, [group.id]: group }), {})

      const clipboard = JSON.stringify({
        items,
        ports,
        connections,
        groups,
        pasteCount: 1
      })

      window.api.copy(clipboard)
    },

    paste () {
      try {
        const state = window.api.paste()
        const parsed = JSON.parse(state as string) as {
          items: Record<string, Item>
          connections: Record<string, Connection>
          groups: Record<string, Group>
          ports: Record<string, Port>,
          pasteCount: number
        }
        const mapped = idMapper.mapStandardCircuitIds(parsed) as {
          items: Record<string, Item>
          connections: Record<string, Connection>
          groups: Record<string, Group>
          ports: Record<string, Port>,
          pasteCount: number
        }

        this.commitState()
        this.deselectAll()

        Object
          .keys(mapped.ports)
          .forEach(portId => {
            mapped.ports[portId].value = 0
          })

        Object
          .values(mapped.items)
          .forEach(item => {
            item.position.x += 20 * parsed.pasteCount
            item.position.y += 20 * parsed.pasteCount
            item.isSelected = false

            this.addNewItem({
              item,
              ports: item.portIds.map(portId => mapped.ports[portId])
            })

            this.setItemBoundingBox(item.id)
            this.setItemPortPositions(item.id)
            this.setSelectionState({ id: item.id, value: true })
            this.resetItemValue(item)
          })

        Object
          .values(mapped.connections)
          .forEach(connection => this.connect(connection))

        Object
          .values(mapped.groups)
          .forEach(group => {
            this.groups[group.id] = group

            this.setGroupBoundingBox(group.id)
            this.setSelectionState({ id: group.id, value: true })
          })

        const clipboard = JSON.stringify({
          ...JSON.parse(state),
          pasteCount: parsed.pasteCount + 1
        })

        window.api.copy(clipboard)
      } catch (error) {
        console.log('ERROR: ', error)
        // TODO: clear clipboard?
      }
    }
  }
})
// TODO: when debugger is turned off, make sure all elements take on values defined in valueMap
