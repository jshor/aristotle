import draw2d from 'draw2d'

export default class ZoomService {
  constructor (editor) {
    this.editor = editor
  }

  getZoomPercentage = () => {
    return Math.ceil((1 / this.editor.getZoom()) * 100)
  }

  centerAllFigures = () => {
    const group = new draw2d.shape.composite.Group()
    const figures = this.editor.getFigures()

    figures.each((i, figure) => {
      group.assignFigure(figure)
    })

    const x = (this.editor.getWidth() - group.width) / 2
    const y = (this.editor.getHeight() - group.height) / 2

    group.setX(x)
    group.setY(y)

    figures.each((i, figure) => {
      group.unassignFigure(figure)
    })

    this.editor.remove(group)
  }

  panToCenter = () => {
    const viewBox = this.editor.parent.getBoundingClientRect()

    const left = (this.editor.getWidth() - viewBox.width) / 2
    const top = (this.editor.getHeight() - viewBox.height) / 2

    this.editor.parent.scrollTo(left, top)
  }

  scalePanByZoom = (viewBox, canvas, scroll, oldZoom, newZoom) => {
    const focusPointX = scroll.left + (viewBox.width / 2)
    const focusPointY = scroll.top + (viewBox.height / 2)

    const scaleChange = (1 / newZoom) - (1 / oldZoom)

    const offsetX = -(focusPointX * scaleChange) * oldZoom
    const offsetY = -(focusPointY * scaleChange) * oldZoom

    const newFocusPointX = focusPointX - offsetX
    const newFocusPointY = focusPointY - offsetY

    const x = newFocusPointX - (viewBox.width / 2)
    const y = newFocusPointY - (viewBox.height / 2)

    const left = canvas.width / newZoom < viewBox.width ? 0 : x
    const top = canvas.height / newZoom < viewBox.height ? 0 : y

    return {
      left: left,
      top: top
    }
  }

  setZoomLevel (level) {
    const viewBox = this.editor.parent.getBoundingClientRect()
    const canvas = this.editor.html[0].getBoundingClientRect()
    const scroll = {
      left: this.editor.getScrollLeft(),
      top: this.editor.getScrollTop()
    }
    const oldZoom = this.editor.zoomFactor
    const newZoom = oldZoom + level * 0.25

    // compute the new left and top coordinates of the viewBox
    const { left, top } = this.scalePanByZoom(viewBox, canvas, scroll, oldZoom, newZoom)

    this.editor.parent.scrollTo(left, top)

    // update the zoom factor
    this.editor.setZoom(newZoom)
  }
}
