import { layout } from 'draw2d'

export default class XYLocator extends layout.locator.XYAbsPortLocator {
  public x: number

  public y: number
  
  constructor (x: number, y: number) {
    super(x, y)

    this.x = x
    this.y = y
  }
}