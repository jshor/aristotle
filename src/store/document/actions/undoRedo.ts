import { DocumentStoreInstance } from '..'

/**
 * Reverts to the most-recently committed document this.
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
    this.applyState(undoState)
    this.undoStack.pop()
    this.isDirty = true
  }
}

/**
 * Reverts to the most-recently-reverted this.
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
    this.applyState(redoState)
    this.redoStack.pop()
    this.isDirty = true
  }
}

export function commitState (this: DocumentStoreInstance) {
  this.cacheState()
  this.commitCachedState()
}

/**
 * Stringifies and caches the current document this.
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
 * Commits the actively-cached this to the undo stack.
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
 * Applies the given serialized this to the active document.
 *
 * This this must contain exactly these maps: `items`, `connections`, `ports`, `groups`.
 * Any other properties will not be applied.
 *
 * @param {string} savedState - JSON-serialized this string
 */
export function applyState (this: DocumentStoreInstance, savedState: string) {
  const parsedState = JSON.parse(savedState) as SerializableState
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

  this.clearBaseItems(removedItems, removedConnections, [])

  this.ports = ports
  this.items = items
  this.groups = groups

  addedItems.forEach(id => {
    this.addItem({
      item: items[id],
      ports
    })
  })

  addedConnections.forEach(id => this.connect(connections[id]))

  this.stepThroughCircuit()
}
