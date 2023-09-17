import Direction from '@/types/enums/Direction'
import rotation from './rotation'
import Port from '@/types/interfaces/Port'
import Point from '@/types/interfaces/Point'
import WireGeometry from '@/types/types/WireGeometry'
import ControlPoint from '@/types/interfaces/ControlPoint'

const WIRE_PADDING = 15

/**
 * Renders the wire geometry for the given source and target ports.
 *
 * @param source
 * @param target
 */
export default function renderLayout (source: ControlPoint, target: ControlPoint): WireGeometry {
  const a = source.position
  const b = target.position
  const { start, end } = getEndpoints(a, b)

  if (start.x === end.x || start.y === end.y || end.x <= 1 && start.x <= 1 || end.y <= 1 && start.y <= 1) {
    return computeStraightLine(start, end)
  }

  const sourceDirection = getPortDirection(source, a, b)
  const targetDirection = getPortDirection(target, a, b)

  return computeBezier(sourceDirection, targetDirection, start, end)
}


export function computeStraightLine (a: Point, b: Point) {
  return {
    path: `M ${a.x},${a.y} L ${b.x},${b.y}`,
    width: Math.abs(a.x - b.x) + WIRE_PADDING,
    height: Math.abs(a.y - b.y) + WIRE_PADDING,
    minX: -(WIRE_PADDING / 2),
    minY: -(WIRE_PADDING / 2)
  }
}

/**
 * Reverses the orientation of a point by 180 degrees, if the dimension on an axis exceeds that of its wire's opposite end.
 * This gives the visual effect of "pinching the wire" so that weird, unnecessary curves aren't sticking out of wire connection points.
 *
 * @param {number} direction
 * @returns {number}
 */
export function inflectDirection (direction: number, a: Point, b: Point): Direction {
  switch (direction) {
    case Direction.Left:
      return a.y > b.y ? Direction.Right : Direction.Left
    case Direction.Top:
      return a.x < b.x ? Direction.Bottom : Direction.Top
    case Direction.Right:
      return a.y > b.y ? Direction.Left : Direction.Right
    case Direction.Bottom:
      return a.x < b.x ? Direction.Top : Direction.Bottom
    default:
      return inflectDirection(rotation.rotate(direction), a, b) // normalize direction to [0,3] and try again
  }
}

/**
 * Returns the wire direction for a given port.
 *
 * @param {IPort} port
 * @param {Point} a - the source point
 * @param {Point} b - the target point
 * @returns {number}
 */
export function getPortDirection (port: ControlPoint, a: Point, b: Point) {
  // the true direction needs to take into account inherent orientation + its rotation
  // bezier index directions are one integer off (see computeBezier()) -- subtract by 1
  let direction = rotation.rotate(port.orientation + port.rotation - 1)

  if (port.canInflect) {
    // inflect direction to give the "pinched" appearance when dragged out of range
    direction = inflectDirection(direction, a, b)

    if (port.rotation % 4 === 1 || port.rotation % 4 === 2) {
      direction = rotation.rotate(direction - 2)
    }
  }

  return direction
}

/**
 * Updates the source and target endpoints such that the start and end are true.
 * This prevents translations or rotations from "swapping" the start and end points.
 *
 * @param {IPort} port
 * @param {Point} a - the source point
 * @param {Point} b - the target point
 * @returns {object<{ start: Point, end: Point }>}
 */
export function getEndpoints (a: Point, b: Point): { start: Point, end: Point } {
  if (a.x <= b.x) {
    if (a.y <= b.y) {
      // top left (a) to bottom right (b)
      return {
        start: {
          x: 0,
          y: 0
        },
        end: {
          x: Math.floor(b.x - a.x),
          y: Math.floor(b.y - a.y)
        }
      }
    }
    // bottom left (a) to top right (b)
    return {
      start: {
        x: 0,
        y: Math.floor(a.y - b.y)
      },
      end: {
        x: Math.floor(b.x - a.x),
        y: 0
      }
    }
  }

  if (a.y <= b.y) {
    // bottom left (b) to top right (a)
    return {
      start: {
        x: Math.floor(a.x - b.x),
        y: 0
      },
      end: {
        x: 0,
        y: Math.floor(b.y - a.y)
      }
    }
  }

  // top left (b) to bottom right (a)
  return {
    start: {
      x: Math.floor(a.x - b.x),
      y: Math.floor(a.y - b.y)
    },
    end: {
      x: 0,
      y: 0
    }
  }
}

/**
 * Computes a Bezier SVG curve path with respect to given source and target directions and positions.
 *
 * @param {number} sourceDirection - the direction that the source is pointing to
 * @param {number} targetDirection - the direction that the target is pointing from
 * @param {Point} start - the source port position
 * @param {Point} end - the target port position
 */
export function computeBezier (sourceDirection: number, targetDirection: number, start: Point, end: Point): WireGeometry {
  const x1 = start.x
  const y1 = start.y
  const x4 = end.x
  const y4 = end.y

  // TODO: change dx/dy to be more user-friendly
  const dx = Math.max(Math.abs(x1 - x4) / 2, 10)
  const dy = Math.max(Math.abs(y1 - y4) / 2, 10)

  const round = (n: number) => Math.round(n * 1000) / 1000

  const x2 = round([x1, x1 + dx, x1, x1 - dx][sourceDirection])
  const y2 = round([y1 - dy, y1, y1 + dy, y1][sourceDirection])
  const x3 = round([x4, x4 + dx, x4, x4 - dx][targetDirection])
  const y3 = round([y4 - dy, y4, y4 + dy, y4][targetDirection])

  const path = [
    'M', round(x1), round(y1),
    'C', x2, y2, x3, y3, round(x4), round(y4)
  ].join(' ')

  const minX = Math.min(x1, x2, x3, x4) - WIRE_PADDING / 2
  const maxX = Math.max(x1, x2, x3, x4) + WIRE_PADDING / 2
  const minY = Math.min(y1, y2, y3, y4) - WIRE_PADDING / 2
  const maxY = Math.max(y1, y2, y3, y4) + WIRE_PADDING / 2

  const width = maxX - minX + WIRE_PADDING
  const height = maxY - minY + WIRE_PADDING

  return { width, height, path, minX, minY }
}
