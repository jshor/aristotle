import { DocumentStoreInstance } from '..'
import { v4 as uuid } from 'uuid'

/**
 * Groups together all selected items and connections.
 * If any of those selected elements are a member of a group, that group will be destroyed.
 */
export function group (this: DocumentStoreInstance) {
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

  this.setZIndex(zIndex)
  this.setGroupBoundingBox(id)
}

/**
 * Destroys all selected groups.
 */
 export function ungroup (this: DocumentStoreInstance) {
  this.commitState()

  for (const id in this.groups) {
    if (this.groups[id].isSelected) {
      this.destroyGroup(id)
    }
  }
}

/**
 * Destroys the group having the given ID.
 *
 * @param groupId
 */
export function destroyGroup (this: DocumentStoreInstance, groupId: string) {
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
}
