import draw2d from 'draw2d'
import ManagerBase from './ManagerBase'
import { ScreenPoint } from '../types'

/**
 * Extends all panning and zooming functionality of draw2d.Canvas defaults.
 *
 * @class ViewportManager
 */
export default class ViewportManager extends ManagerBase {
  /**
   * Return the current zoom level as a percentage.
   *
   * @returns {number} zoom percentage, (0,100]
   */
  public getZoomPercentage = () => {
    return Math.ceil((1 / this.canvas.getZoom()) * 100)
  }

  /**
   * Moves all figures together to the center of the canvas.
   */
  public centerAllFigures = (): void => {
    const group = new draw2d.shape.composite.Group()
    const figures = this.canvas.getFigures()

    // assign all figures in the canvas to a group
    figures.each((i, figure) => {
      group.assignFigure(figure)
    })

    // move the group to the center of the canvas
    const x = (this.canvas.getWidth() - group.width) / 2
    const y = (this.canvas.getHeight() - group.height) / 2

    group.setX(x)
    group.setY(y)

    // remove all figures from the group
    figures.each((i, figure) => {
      group.unassignFigure(figure)
    })
  }

  /**
   * Pans the UI viewbox to the center of the canvas.
   */
  public panToCenter = () => {
    const viewBox = this.editor.parent.getBoundingClientRect()

    const left = (this.canvas.getWidth() - viewBox.width) / 2
    const top = (this.canvas.getHeight() - viewBox.height) / 2

    this.editor.parent.scrollTo(left, top)
  }

  /**
   * Computes the viewbox screen coordinates scaled according the current zoom level.
   *
   * @param {ClientRect} viewBox - the UI-visible canvas area
   * @param {ScreenPoint} scroll - the screen coordinates of the scrolled HTML container
   * @param {number} oldZoom - the original zoom level
   * @param {number} newZoom - the zoom level to change to
   * @returns {ScreenPoint}
   */
  public scaleViewboxByZoom = (
    viewBox: ClientRect,
    scroll: ScreenPoint,
    oldZoom: number,
    newZoom: number
  ): ScreenPoint => {
    const focusPointX = scroll.left + (viewBox.width / 2)
    const focusPointY = scroll.top + (viewBox.height / 2)

    const scaleChange = (1 / newZoom) - (1 / oldZoom)

    const offsetX = -(focusPointX * scaleChange) * oldZoom
    const offsetY = -(focusPointY * scaleChange) * oldZoom

    const newFocusPointX = focusPointX - offsetX
    const newFocusPointY = focusPointY - offsetY

    const x = newFocusPointX - (viewBox.width / 2)
    const y = newFocusPointY - (viewBox.height / 2)

    // if viewBox is bigger than the scaled canvas, fallback to 0 coords
    const left = this.canvas.width / newZoom < viewBox.width ? 0 : x
    const top = this.canvas.height / newZoom < viewBox.height ? 0 : y

    return { left, top }
  }

  /**
   * Updates the canvas zoom factor.
   * This will maintain the viewbox in a scaled position.
   *
   * @param {number} newZoom - new zoom factor
   */
  public setZoomLevel = (newZoom: number): void => {
    const viewBox = this.editor.parent.getBoundingClientRect()
    const scroll = {
      left: this.canvas.getScrollLeft(),
      top: this.canvas.getScrollTop()
    }
    const oldZoom = this.canvas.zoomFactor

    // compute the new left and top coordinates of the viewBox
    const { left, top } = this.scaleViewboxByZoom(viewBox, scroll, oldZoom, newZoom)

    this.editor.parent.scrollTo(left, top)

    // update the zoom factor
    this.canvas.setZoom(newZoom)
  }
}
