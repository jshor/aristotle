import { layout } from 'draw2d'

const getPortLocator = ({ x, y, type }) => {
  if (isNaN(x) || isNaN(y)) {
    if (type === 'output') {
      return new layout.locator.RightLocator()
    }
    return new layout.locator.LeftLocator()
  }
  return new layout.locator.XYAbsPortLocator(x, y)
}

export default getPortLocator