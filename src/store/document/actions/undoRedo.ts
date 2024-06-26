import { DocumentStoreInstance } from '..'
import BaseItem from '@/types/interfaces/BaseItem'
import SerializableState from '@/types/interfaces/SerializableState'

/**
 * Reverts to the most-recently committed document state.
 */
export function undo (this: DocumentStoreInstance) {
  const undoState = this.undoStack.slice(-1).pop()

  if (undoState) {
    this.redoStack.push(JSON.stringify({
      connections: this.connections,
      items: this.items,
      ports: this.ports,
      groups: this.groups
    }))
    this.applySerializedState(undoState)
    this.undoStack.pop()
    this.isDirty = true
  }
}

/**
 * Reverts to the most-recently-reverted state.
 */
export function redo (this: DocumentStoreInstance) {
  const redoState = this.redoStack.slice(-1).pop()

  if (redoState) {
    this.undoStack.push(JSON.stringify({
      connections: this.connections,
      items: this.items,
      ports: this.ports,
      groups: this.groups
    }))
    this.applySerializedState(redoState)
    this.redoStack.pop()
    this.isDirty = true
  }
}

/**
 * Commits the current editor state to the undo stack.
 */
export function commitState (this: DocumentStoreInstance) {
  this.cacheState()
  this.commitCachedState()
}

/**
 * Stringifies and caches the current document state.
 * This will save all connections, items, ports, and groups.
 */
export function cacheState (this: DocumentStoreInstance) {
  this.cachedState = JSON.stringify({
    connections: this.connections,
    items: this.items,
    ports: this.ports,
    groups: this.groups
  })
}

/**
 * Commits the actively-cached state to the undo stack.
 * This will clear the redo stack.
 */
export function commitCachedState (this: DocumentStoreInstance) {
  if (this.cachedState) {
    this.undoStack.push(this.cachedState.toString())
    this.cachedState = null
    this.redoStack = []
    this.isDirty = true
  }
}

/**
 * Applies the given state to the active document.
 */
export function applyDeserializedState (this: DocumentStoreInstance, {
  items,
  connections,
  ports,
  groups
}: SerializableState) {
  this.deselectAll()

  /**
   * Returns the IDs of all items in `a` that are not in `b`.
   */
  function getExcludedMemberIds (a: Record<string, BaseItem>, b: Record<string, BaseItem>) {
    const aIds = Object.keys(a)
    const bIds = new Set(Object.keys(b))

    return aIds.filter(id => !bIds.has(id))
  }

  // find all items and connections in current this that are not in the applied this and remove them from the circuit
  const removedItems = getExcludedMemberIds(this.items, items)
  const removedConnections = getExcludedMemberIds(this.connections, connections)
  const removedGroups = getExcludedMemberIds(this.groups, groups)

  // add any new items from the the applied this to the circuit
  const addedItems = getExcludedMemberIds(items, this.items)
  const addedConnections = getExcludedMemberIds(connections, this.connections)

  removedConnections.forEach(id => this.disconnectById(id))
  removedItems.forEach(id => this.removeElement(id))
  removedGroups.forEach(id => delete this.groups[id])

  /**
   * Applies the state of `newObj` onto `oldObj`, omitting the keys in `omit`.
   */
  function applyObjectState<T extends {}> (oldObj: T, newObj: T, ...omit: (keyof T)[]) {
    Object
      .keys(newObj)
      .forEach(key => {
        const k = key as keyof T

        if (oldObj?.[k] && !omit.includes(k)) {
          oldObj[k] = newObj[k]
        }
      })
  }

  Object
    .keys(items)
    .forEach(id => {
      if (this.items[id]) {
        this.setItemPosition({
          id,
          position: items[id].position
        })
        applyObjectState(this.items[id], items[id], 'clock')
        this.setItemBoundingBox(id)
        this.setItemSelectionState(id, items[id].isSelected)
      }
    })

  addedItems.forEach(id => {
    this.addItem({
      item: items[id],
      ports
    })
    this.setItemSelectionState(id, items[id].isSelected)
  })

  addedConnections.forEach(id => this.connect(connections[id]))

  Object
    .keys(connections)
    .forEach(id => {
      applyObjectState(this.connections[id], connections[id])
      this.setConnectionSelectionState(id, connections[id].isSelected)
    })

  Object
    .keys(groups)
    .forEach(id => {
      if (!this.groups[id]) {
        this.groups[id] = groups[id]
      }
      this.setGroupBoundingBox(id)
      this.setGroupSelectionState(id, true)
    })

  Object
    .keys(ports)
    .forEach(id => {
      applyObjectState(this.ports[id], ports[id], 'value', 'wave')
    })
}

/**
 * Applies the given serialized state to the active document.
 * The serialized JSON state must contain exactly these maps:
 *  - `items`
 *  - `connections`
 *  - `ports`
 *  - `groups`
 */
export function applySerializedState (this: DocumentStoreInstance, savedState: string) {
  this.applyDeserializedState(JSON.parse(savedState) as SerializableState)
}
