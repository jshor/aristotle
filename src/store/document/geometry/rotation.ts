
import Direction from '@/types/enums/Direction'
import BoundingBox from '@/types/types/BoundingBox'
import Item from '@/types/interfaces/Item'
import Point from '@/types/interfaces/Point'

/**
 * Normalizes the given rotation with respect to any additional rotation to augment by.
 *
 * @param {number} rotation
 * @param {number} additional
 * @returns {number}
 */
function rotate (rotation: number, additional = 0): Direction {
  return ((rotation + additional % 4) + 4) % 4
}

/**
 * Returns the absolute Cartesian position of an item based on its parent group's rotation and position.
 *
 * @param groupBoundingBox - group for which the item is a member of
 * @param item - item to compute position for
 * @param direction - rotation direction (1 for CW, -1 for CCW)
 * @returns
 */
function getGroupedItemRotatedPosition (groupBoundingBox: BoundingBox, centroid: Point, width: number, height: number, direction: number): Point {
  const w = groupBoundingBox.right - groupBoundingBox.left
  const h = groupBoundingBox.bottom - groupBoundingBox.top
  const mx = groupBoundingBox.left + (w / 2)
  const my = groupBoundingBox.top + (h / 2)
  const cx = centroid.x
  const cy = centroid.y
  const ax = cx + (width / 2)
  const ay = cy + (height / 2)
  const L = Math.hypot(mx - ax, my - ay)
  const currentAngleRad = Math.atan2((ay - my), (ax - mx))
  const newAngle = (90 * direction * (Math.PI / 180)) + currentAngleRad
  const newAx = (L * Math.cos(newAngle)) + mx
  const newAy = (L * Math.sin(newAngle)) + my

  return {
    x: newAx - (width / 2),
    y: newAy - (height / 2)
  }
}

export default {
  rotate,
  getGroupedItemRotatedPosition
}
