/**
 * Normalizes the given rotation with respect to any additional rotation to augment by.
 *
 * @param {number} rotation
 * @param {number} additional
 * @returns {number}
 */
export default function rotate (rotation, additional = 0) {
  return ((rotation + additional % 4) + 4) % 4
}
