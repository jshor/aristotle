import $ from 'jquery'
import { Vue } from 'vue-property-decorator'

export default class DragService {
  component: Vue

  el: any

  constructor (component: Vue) {
    this.component = component
  }

  getSnappedElements (): any[] {
    return this.el
      .data('uiDraggable')
      .snapElements
      .filter(({ snapping }) => snapping)
  }

  createDrag (config) {
    this.el = $(this.component.$refs.draggable) as any

    const snapSize = 1

    this.el.draggable(config)
  }
}
