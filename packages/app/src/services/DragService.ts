import $ from 'jquery'

export default class DragService {
  component: any

  el: any

  constructor (component: any) {
    this.component = component
  }

  getSnappedElements (): any[] {
    return this.el
      .data('uiDraggable')
      .snapElements
      .filter(({ snapping }) => snapping)
  }

  createDrag (config) {
    if (!this.component.$refs.draggable) return

    this.el = $(this.component.$refs.draggable) as any

    const snapSize = 1

    this.el.draggable(config)
  }
}
