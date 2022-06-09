
import Direction from '@/types/enums/Direction'
// TODO: rename parent 'layout' folder to 'geometry'

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
function getGroupedItemRotatedPosition (groupBoundingBox: BoundingBox, item: Item, direction: number): Point {
  const w = groupBoundingBox.right - groupBoundingBox.left
  const h = groupBoundingBox.bottom - groupBoundingBox.top
  const mx = groupBoundingBox.left + (w / 2)
  const my = groupBoundingBox.top + (h / 2)
  const cx = item.position.x
  const cy = item.position.y
  const ax = cx + (item.width / 2)
  const ay = cy + (item.height / 2)
  const L = Math.hypot(mx - ax, my - ay)
  const currentAngleRad = Math.atan2((ay - my), (ax - mx))
  const newAngle = (90 * direction * (Math.PI / 180)) + currentAngleRad
  const newAx = (L * Math.cos(newAngle)) + mx
  const newAy = (L * Math.sin(newAngle)) + my

  return {
    x: newAx - (item.width / 2),
    y: newAy - (item.height / 2)
  }
}

/**
 * Returns the absolute Cartesian position of a port based on its parent's rotation and position.
 *
 * @param port
 * @param portList
 * @param item
 * @param index
 * @returns
 */
function getRotatedPortPosition (port: Port, portList: Port[], item: Item, index: number): Point {
  const { left, top, bottom, right } = item.boundingBox

  // ports use CSS "space around" flex property for positions
  // compute the spacing of each port based on the element width/height
  // there are n spacings for n ports
  const spacing = (port.orientation + item.rotation) % 2 === 0
    ? Math.floor((bottom - top) / portList.length)
    : Math.floor((right - left) / portList.length)

  // compute the distance (from left-to-right or top-to-bottom)
  // the distance will be the center of the computed spacing
  const distance = (spacing * (index + 1)) - (spacing / 2)

  switch (rotate(port.orientation + item.rotation)) {
    case Direction.Left:
      return { x: left, y: top + distance }
    case Direction.Top:
      return { x: right - distance, y: top }
    case Direction.Right:
      return { x: right, y: bottom - distance }
    case Direction.Bottom:
    default:
      return { x: left + distance, y: bottom }
  }
}

export default {
  rotate,
  getGroupedItemRotatedPosition,
  getRotatedPortPosition
}
