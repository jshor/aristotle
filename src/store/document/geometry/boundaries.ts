import SnapMode from "@/types/enums/SnapMode"
import Point from "@/types/interfaces/Point"
import BoundingBox from "@/types/types/BoundingBox"

/**
 * Rounds x to the nearest n.
 */
function roundToNth (x: number, n: number) {
  return Math.round(x / n) * n
}

/**
 * Returns true if a is within the radial distance of b.
 */
function isInNeighborhood (a: Point, b: Point, radius: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= radius
}

/**
 * Returns the delta of rounding the top-left point of the given bounding box to the nearest distance.
 * This will achieve the effect of "snapping to grid."
 *
 * @param a - the bounding box of the element moving
 * @param distance - the grid size
 */
function getGridSnapPosition (a: BoundingBox, distance: number): Point {
  return {
    x: roundToNth(a.left, distance) - a.left,
    y: roundToNth(a.top, distance) - a.top
  }
}

/**
 * Returns the offset Cartesian distance between bounding box `a` and any other bounding boxes within the radial `distance`.
 * If no bounding boxes are within 'd' distance, it returns an offset of (0, 0).
 *
 * @param boundingBoxes
 * @param a
 * @param d
 */
function getRadialSnapOffset (boundingBoxes: BoundingBox[], a: BoundingBox, distance: number): Point {
  for (let i = 0; i < boundingBoxes.length; i++) {
    const b = boundingBoxes[i]

    if (isInNeighborhood({ x: b.left, y: b.top }, { x: a.left, y: a.top }, distance)) {
      return {
        x: b.left - a.left,
        y: b.top - a.top
      }
    }
  }

  return { x: 0, y: 0 }
}

/**
 * Returns the offset Cartesian distance between bounding box `a` and any other bounding boxes within the linear `distance`.
 * If no bounding boxes are within 'd' distance, it returns an offset of (0, 0).
 *
 * @param boundingBoxes
 * @param a
 * @param d
 */
function getOuterSnapOffset (boundingBoxes: BoundingBox[], a: BoundingBox, distance: number): Point {
  const offset: Point = { x: 0, y: 0 }

  for (let i = 0; i < boundingBoxes.length; i++) {
    const b = boundingBoxes[i]
    const ts = Math.abs(b.top - a.bottom) <= distance
    const bs = Math.abs(b.bottom - a.top) <= distance
    const ls = Math.abs(b.left - a.right) <= distance
    const rs = Math.abs(b.right - a.left) <= distance

    if (
      (a.left <= b.right && a.left >= b.left) ||
      (a.right >= b.left && a.right <= b.right) ||
      (a.left <= b.left && a.right >= b.right)
    ) {
      // a is within the y-axis boundaries
      if (ts) offset.y = b.top - a.bottom
      if (bs) offset.y = b.bottom - a.top
    }

    if (
      (a.top <= b.bottom && a.top >= b.top) ||
      (a.bottom >= b.top && a.bottom <= b.bottom) ||
      (a.top <= b.top && a.bottom >= b.bottom)
    ) {
      // a is within the x-axis boundaries
      if (ls) offset.x = b.left - a.right
      if (rs) offset.x = b.right - a.left
    }
  }

  return offset
}

function getSnapOffset (boundingBoxes: BoundingBox[], boundingBox: BoundingBox, snapMode: SnapMode, distance: number) {
  switch (snapMode) {
    case SnapMode.Radial:
      return getRadialSnapOffset(boundingBoxes, boundingBox, distance)
    case SnapMode.Grid:
      return getGridSnapPosition(boundingBox, distance)
    case SnapMode.Outer:
    default:
      return getOuterSnapOffset(boundingBoxes, boundingBox, distance)
  }
}

/**
 * Returns true if line a intersects with line B.
 *
 * @param a1 - first point of a
 * @param a2 - second point of a
 * @param b1 - first point of b
 * @param b2 - second point of b
 */
function hasLinearIntersection (a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const ccw = (a: Point, b: Point, c: Point) => {
    return (c.y-a.y) * (b.x-a.x) > (b.y-a.y) * (c.x-a.x)
  }

  return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2)
}

/**
 * Returns true if the lines between the given connection points intersect with the given bounding box.
 */
function areLinesIntersectingRectangle (points: Point[], boundingBox: BoundingBox): boolean {
  let previousPoint = points[0]

  for (let i = 1; i < points.length; i++) {
    if (isLineIntersectingRectangle(previousPoint, points[i], boundingBox)) {
      return true
    }

    previousPoint = points[i]
  }

  return false
}

/**
 * Returns true if the overlaps with the given bounding box.
 *
 * @param a1 - first point of the line
 * @param a2 - second point of the line
 * @param boundingBox - the rectange
 */
function isLineIntersectingRectangle (a1: Point, a2: Point, boundingBox: BoundingBox): boolean {
  const b1 = { x: boundingBox.left, y: boundingBox.top }
  const b2 = { x: boundingBox.right, y: boundingBox.top }
  const b3 = { x: boundingBox.right, y: boundingBox.bottom }
  const b4 = { x: boundingBox.left, y: boundingBox.bottom }

  return hasLinearIntersection(a1, a2, b1, b2)
    || hasLinearIntersection(a1, a2, b2, b3)
    || hasLinearIntersection(a1, a2, b3, b4)
    || hasLinearIntersection(a1, a2, b4, b1)
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
 * Scales the bounding box by the given scalar.
 *
 * @param box
 * @param scale
 */
function scaleBoundingBox (box: BoundingBox, scale: number): BoundingBox {
  return {
    left: box.left * scale,
    top: box.top * scale,
    bottom: box.bottom * scale,
    right: box.right * scale
  }
}

/**
 * Returns true if the given bounding box is one- or two-dimensional.
 */
function isOneOrTwoDimensional (box: BoundingBox) {
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

/**
 * Computes the bounding box of the given item.
 *
 * @param item
 * @returns computed bounding box
 */
function getBoundingBox (position: Point, rotation: number, width: number, height: number): BoundingBox {
  if (rotation % 2 === 0) {
    // item is right side up or upside down
    return {
      left: position.x,
      top: position.y,
      bottom: height + position.y,
      right: width + position.x
    }
  }

  // item is rotated at a 90 degree angle (CW or CCW)
  const midX = position.x + (width / 2)
  const midY = position.y + (height / 2)

  return {
    left: midX - (height / 2),
    top: midY - (width / 2),
    right: midX + (height / 2),
    bottom: midY + (width / 2)
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

/**
 * Returns the center point of the given bounding box.
 */
function getBoundingBoxMidpoint (boundingBox: BoundingBox): Point {
  const width = boundingBox.right - boundingBox.left
  const height = boundingBox.bottom - boundingBox.top

  return {
    x: width / 2,
    y: height / 2
  }
}

/**
 * Given parent and child bounding boxes, determines the screen point (top left) of the child centered in the parent.
 *
 * @param parentBox
 * @param childBox
 * @param factor - any factor to round by
 */
function getCenteredScreenPoint (parentBox: BoundingBox, childBox: BoundingBox, factor: number): Point {
  const parentMidpoint = getBoundingBoxMidpoint(parentBox)
  const childWidth = childBox.right - childBox.left
  const childHeight = childBox.bottom - childBox.top

  return {
    x: roundToNth(parentMidpoint.x - (childWidth / 2), factor),
    y: roundToNth(parentMidpoint.y - (childHeight / 2), factor)
  }
}

export default {
  isInNeighborhood,
  getRadialSnapOffset,
  getOuterSnapOffset,
  getGridSnapPosition,
  areLinesIntersectingRectangle,
  isLineIntersectingRectangle,
  scaleBoundingBox,
  isOneOrTwoDimensional,
  getLinearBoundaries,
  getPointBoundary,
  hasIntersection,
  getBoundingBox,
  getGroupBoundingBox,
  getBoundingBoxMidpoint,
  getCenteredScreenPoint,
  getSnapOffset
}
