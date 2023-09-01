import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import getConnectionChain from '@/utils/getConnectionChain'
import ItemType from '@/types/enums/ItemType'


export function deselectItem (this: DocumentStoreInstance, id: string) {
  this.setSelectionState({ id, value: false })
}

export function selectItem (this: DocumentStoreInstance, id: string, keepSelection: boolean = false) {
  if (!keepSelection) {
    this.deselectAll()
  }

  this.setSelectionState({ id, value: true })
}

/**
 * Selects all items and connections.
 */
export function selectAll (this: DocumentStoreInstance) {
  this.clearStatelessInfo()

  for (let id in this.connections) {
    this.connections[id].isSelected = true
    this.selectedConnectionIds.push(id)
  }

  for (let id in this.items) {
    this.items[id].isSelected = true
    this.selectedItemIds.push(id)
  }
}

/**
 * Deselects all elements.
 */
export function deselectAll (this: DocumentStoreInstance) {
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
}

/**
 * Selects all connections and items (and its connections) that live within the given boundary.
 *
 * @param boundingBox - two-dimensional boundary
 */
export function createSelection (this: DocumentStoreInstance, selection: BoundingBox) {
  if (!boundaries.isOneOrTwoDimensional(selection)) return // omit selection lines or points

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
      this.updateSelectionList({ id, isSelected: true })
    })

  this.selectItemConnections(itemIds)
}

/**
 * Selects all connections that are connected to any of the items in the given list.
 *
 * @param itemIds - list of items to select their connections for
 */
export function selectItemConnections (this: DocumentStoreInstance, itemIds: string[]) {
  const portIds = itemIds.reduce((portIds: string[], itemId: string) => {
    return portIds.concat(this.items[itemId].portIds)
  }, [])

  for (let id in this.connections) {
    const c = this.connections[id]

    if (portIds.includes(c.source) && portIds.includes(c.target)) {
      this.updateSelectionList({ id, isSelected: true })
    }
  }
}

/**
 * Sets the selection this of the given element to the value provided.
 * If the item is a connection segment, then its entire connection chain will take on the same value.
 *
 * @param payload
 * @param payload.id - ID of the item, group, or connection to select
 * @param payload.isSelected - selection this to change to
 */
export function updateSelectionList (this: DocumentStoreInstance, { id, isSelected }: { id: string, isSelected: boolean }) {
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
}

/**
 * Inverts the selection value of the element having the given ID, or forces it to the value provided.
 * If the element is a member of a group, every item in that group will be selected.
 *
 * @param payload.id - the ID of the element to toggle its selection
 * @param payload.value - new selection this value to set to
 */
export function setSelectionState (this: DocumentStoreInstance, { id, value }: { id: string, value: boolean }) {
  const element = this.items[id] || this.connections[id]
  const isSelected = value

  if (!element || element.isSelected === isSelected) return

  if (element.groupId) {
    // if item is part of a group, select all items in that group
    const { itemIds, connectionIds } = this.groups[element.groupId]

    itemIds
      .concat(connectionIds)
      .forEach(id => {
        this.updateSelectionList({ id, isSelected })
      })

    this.updateSelectionList({ id: element.groupId, isSelected })
  } else {
    // otherwise, just select this one item
    this.updateSelectionList({ id, isSelected })
  }
}

/**
 * Places focus back to the last base item or forward to the first base item (according to z-index).
 *
 * @param {boolean} backToFirstItem - true if the next item to focus is the first item, or to the first item otherwise
 */
export function recycleSelection (this: DocumentStoreInstance, backToFirstItem: boolean) {
  const id = backToFirstItem
    ? this.baseItems[0]
    : this.baseItems.slice(-1)[0]

  if (id) {
    this.deselectAll()
    this.setSelectionState({ id: id.id, value: true })
  }
}

/**
 * Deletes all selected items and connections.
 */
export function deleteSelection (this: DocumentStoreInstance) {
  if (!this.hasSelection) return

  this.commitState()
  this
    .selectedConnectionIds
    .forEach(id => this.disconnect(this.connections[id]))
  this
    .selectedItemIds
    .forEach(id => this.removeElement(id))
  this
    .selectedGroupIds
    .forEach(id => id !== null && delete this.groups[id])


  this.deselectAll()
}

export function clearStatelessInfo (this: DocumentStoreInstance) {
  this.unsetConnectionPreview()
  this.connectablePortIds = []
  this.selectedConnectionIds = []
  this.selectedItemIds = []
  this.selectedPortIndex = -1
  this.cachedState = null
  this.activePortId = null
  this.connectionPreviewId = null
}
