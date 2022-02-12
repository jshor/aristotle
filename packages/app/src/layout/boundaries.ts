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

export default {
  isInNeighborhood,
  scaleBoundingBox,
  isTwoDimensional,
  getLinearBoundaries,
  getPointBoundary,
  getBoundaryByCorners,
  hasIntersection
}
