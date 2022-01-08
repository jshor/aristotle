import { ComponentPublicInstance } from "vue"

/**
 * Returns an ancestral component of the given type.
 *
 * @param {Vue} parent - instance to search ancestry of
 * @param {VueConstructor<Vue>} type - type of ancestor component to find
 * @returns {Vue}
 */
export default function getAncestor (parent: any, type: string): any {
  if (parent.isCanvas) {
    return parent
  }
  return getAncestor(parent.$parent, type)
}
