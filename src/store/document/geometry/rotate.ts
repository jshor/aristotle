import Direction from '@/types/enums/Direction'

/**
 * Normalizes the given rotation with respect to any additional rotation to augment by.
 *
 * @param {number} rotation
 * @param {number} additional
 * @returns {number}
 */
export default function rotate (rotation: Direction, additional: Direction = 0): Direction {
  return ((rotation + additional % 4) + 4) % 4
}
