import Direction from '../enums/Direction'
import Point from './Point'

interface ControlPoint {
  position: Point
  rotation: number
  orientation: Direction
  isSelected?: boolean
  canInflect?: boolean
}

export default ControlPoint
