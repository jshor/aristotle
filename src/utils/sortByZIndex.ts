import BaseItem from "@/types/interfaces/BaseItem"

/**
 * Sorting function to sort BaseItems by their zIndex values in ascending order.
 */
export default function sortByZIndex (a: BaseItem, b: BaseItem) {
  if (a.zIndex > b.zIndex) return 1
  else if (a.zIndex < b.zIndex) return -1
  return 0
}
