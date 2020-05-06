import { layout } from 'draw2d'
import XYLocator from '../layout/XYLocator'

export default function getPortLocator ({ x, y, type }) {
  if (isNaN(x) || isNaN(y)) {
    if (type === 'output') {
      return new layout.locator.RightLocator()
    }
    return new layout.locator.LeftLocator()
  }
  
  return new XYLocator(x, y)
}