import BaseItem from '@/types/interfaces/BaseItem'
import { DocumentStoreInstance } from '..'
import sortByZIndex from '@/utils/sortByZIndex'

/**
 * Sends the selected base item(s) to the back.
 */
export function sendBackward (this: DocumentStoreInstance) {
  this.commitState()
  this.incrementZIndex(-1)
}

/**
 * Brings the selected base item(s) to the front.
 */
export function bringForward (this: DocumentStoreInstance) {
  this.commitState()
  this.incrementZIndex(1)
}

/**
 * Sends the selected base item(s) backward by one z-index.
 */
export function sendToBack (this: DocumentStoreInstance) {
  this.commitState()
  this.setZIndex(1)
}

/**
 * Brings the selected base item(s) forward by one z-index.
 */
export function bringToFront (this: DocumentStoreInstance) {
  this.commitState()
  this.setZIndex(this.zIndex)
}

/**
 * Increments the zIndex of all items selected.
 * If an item's movement collides with another item's movement, or it becomes out of bounds, its zIndex will not change.
 *
 * @param {number} direction - 1 to increment, -1 to decrement
 */
export function incrementZIndex (this: DocumentStoreInstance, direction: number) {
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

  const frozenIds = new Set<string>()

  selectedItemIds.forEach(id => {
    const currentIndex = baseItems.findIndex(i => i.id === id)
    const nextIndex = currentIndex + direction

    if (nextIndex < 0 || nextIndex >= baseItems.length) {
      // if the next zIndex pushes it out of bounds, freeze it
      frozenIds.add(baseItems[currentIndex].id)
      return
    }

    if (!frozenIds.has(baseItems[nextIndex]?.id)) {
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
}

/**
 * Moves all selected items to the given zIndex values.
 * If those items aren't siblings already, they will be when this is invoked.
 *
 * @param {number} zIndex - new zIndex to move items to
 */
export function setZIndex (this: DocumentStoreInstance, zIndex: number) {
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
}
