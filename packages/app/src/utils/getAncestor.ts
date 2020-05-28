import Vue from 'vue'
import { VueConstructor } from 'vue/types/umd'

/**
 * Returns an ancestral component of the given type.
 *
 * @param {Vue} parent - instance to search ancestry of
 * @param {VueConstructor<Vue>} type - type of ancestor component to find
 * @returns {Vue}
 */
export default function getAncestor (parent: Vue, type: VueConstructor<Vue>): Vue {
  if (parent instanceof type) {
    return parent
  }
  return getAncestor(parent.$parent, type)
}
