function isInNeighborhood (a: Point, b: Point, radius: number): boolean {
  const distX = Math.pow(a.x - b.x, 2)
  const distY = Math.pow(a.y - b.y, 2)

  return Math.sqrt(distX + distY) <= radius
}

function scaleBoundingBox (box: BoundingBox, scale: number): BoundingBox {
  return {
    left: box.left * scale,
    top: box.top * scale,
    bottom: box.bottom * scale,
    right: box.right * scale
  }
}

function isTwoDimensional (box: BoundingBox) {
  return box.left !== box.right || box.top !== box.bottom
}

/**
 * Returns a list of one infinitely-horizontal and one infinitely-vertical boundaries.
 *
 * @param point - the point to compute boundaries for
 * @returns list of bounding boxes
 */
function getLinearBoundaries (point: Point): BoundingBox[] {
  return [
    {
      left: point.x,
      right: point.x,
      top: -Infinity,
      bottom: Infinity
    },
    {
      left: -Infinity,
      right: Infinity,
      top: point.y,
      bottom: point.y
    }
  ]
}

/**
 * Returns a point as a boundary.
 *
 * @param point
 * @returns point boundary
 */
function getPointBoundary (point: Point): BoundingBox {
  return {
    left: point.x,
    top: point.y,
    right: point.x,
    bottom: point.y
  }
}

function getBoundaryByCorners (a: Point, b: Point): BoundingBox {
  return {
    left: Math.min(a.x, b.x),
    right: Math.max(a.x, b.x),
    top: Math.min(a.y, b.y),
    bottom: Math.max(a.y, b.y)
  }
}

/**
 * Returns true if a and b intersect.
 *
 * @param a
 * @param b
 * @returns boolean result of intersection
 */
function hasIntersection (a: BoundingBox, b: BoundingBox): boolean {
  if (a.left >= b.right || b.left >= a.right) {
    // one rect is on left side of other
    return false
  }

  if (a.top >= b.bottom || b.top >= a.bottom) {
    // one rect is above other
    return false
  }

  return true
}

/**
 * Computes the bounding box of the given item.
 *
 * @param item
 * @returns computed bounding box
 */
function getItemBoundingBox (item: Item): BoundingBox {
  if (item.rotation % 2 === 0) {
    // item is right side up or upside down
    return {
      left: item.position.x,
      top: item.position.y,
      bottom: item.height + item.position.y,
      right: item.width + item.position.x
    }
  }

  // item is rotated at a 90 degree angle (CW or CCW)
  const midX = item.position.x + (item.width / 2)
  const midY = item.position.y + (item.height / 2)

  return {
    left: midX - (item.height / 2),
    top: midY - (item.width / 2),
    right: midX + (item.height / 2),
    bottom: midY + (item.width / 2)
  }
}

/**
 * Computes the group bounding box for the given list of bounding boxes.
 *
 * @param boundingBoxes - list of bounding boxes contained
 * @returns computed bounding box
 */
function getGroupBoundingBox (boundingBoxes: BoundingBox[]): BoundingBox {
  return boundingBoxes.reduce((rect, boundingBox) => ({
    left: Math.min(rect.left, boundingBox.left),
    top: Math.min(rect.top, boundingBox.top),
    right: Math.max(rect.right, boundingBox.right),
    bottom: Math.max(rect.bottom, boundingBox.bottom)
  }), {
    left: Infinity,
    top: Infinity,
    right: 0,
    bottom: 0
  })
}

export default {
  isInNeighborhood,
  scaleBoundingBox,
  isTwoDimensional,
  getLinearBoundaries,
  getPointBoundary,
  getBoundaryByCorners,
  hasIntersection,
  getItemBoundingBox,
  getGroupBoundingBox
}
