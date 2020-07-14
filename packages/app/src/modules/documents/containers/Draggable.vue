<template>
  <div
    ref="draggable"
    class="draggable"
    :style="style">
    <div class="draggable__inner">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { Getter } from '../store/decorators'
import IPoint from '../../../interfaces/IPoint'
import IScreenPoint from '../../../interfaces/IScreenPoint'
import DragService from '../../../services/DragService'
import getAncestor from '../../../utils/getAncestor'
import Canvas from './Documents.vue'
import {
  getSnappedId,
  getSnappedPosition,
  screenToPoint
} from '../layout/dragging'

@Component({})
export default class Draggable extends Vue {
  @Prop({
    default: () => ({
      x: 0,
      y: 0
    })
  })
  public position: IPoint

  @Getter('documents', 'zoom')
  public zoom: number

  @Prop({ default: '.snappable' })
  public snap: string

  get style () {
    return {
      left: `${this.position.x}px`,
      top: `${this.position.y}px`
    }
  }

  dragService: DragService

  getCanvas (): Vue {
    return getAncestor(this, Canvas) as Canvas
  }

  mouse: IPoint = {
    x: 0,
    y: 0
  }

  updatePosition (event: MouseEvent, ui: { originalPosition: IScreenPoint, position: IScreenPoint }) {
    const original = ui.originalPosition

    ui.position = {
      left: (event.clientX - this.mouse.x + original.left) / this.zoom,
      top:  (event.clientY - this.mouse.y + original.top ) / this.zoom
    }
  }

  /**
   * Handles the start of the dragging user interaction. Updates the local position and emits it.
   *
   * @param {MouseEvent} event
   * @param {object<{ originalPosition: IScreenPoint, position: IScreenPoint }>} ui - jQuery UI draggable object
   * @param {IScreenPoint} position
   * @emits `dragStart` - in the format: object<{ position: IScreenPoint }>
   */
  onDragStart (event: MouseEvent, ui: { originalPosition: IScreenPoint, position: IScreenPoint }) {
    this.mouse.x = event.clientX
    this.mouse.y = event.clientY

    this.updatePosition(event, ui)

    this.$emit('dragStart', {
      position: screenToPoint(ui.position)
    })
  }

  /**
   * Handles the dragging user interaction. Updates the local position (including snap operations) and emits it.
   *
   * @param {MouseEvent} event
   * @param {object<{ originalPosition: IScreenPoint, position: IScreenPoint }>} ui - jQuery UI draggable object
   * @emits `drag` - in the format: object<{ position: IScreenPoint }>
   */
  onDrag (event: MouseEvent, ui: { originalPosition: IScreenPoint, position: IScreenPoint }) {
    const canvas = this.getCanvas()

    this.updatePosition(event, ui)

    ui.position = getSnappedPosition(this.dragService, canvas, ui.position, 30)

    this.$emit('drag', {
      position: screenToPoint(ui.position)
    })
  }

  /**
   * Handles the end of the dragging user interaction. Emits its final position and the ID of the element it snapped to (if any).
   *
   * @param {MouseEvent} event
   * @param {object<{ originalPosition: IScreenPoint, position: IScreenPoint }>} ui - jQuery UI draggable object
   * @emits `dragEnd` - in the format: object<{ position: IScreenPoint, snappedId: string }>
   */
  onDragEnd (event: MouseEvent, ui: { originalPosition: IScreenPoint, position: IScreenPoint }) {
    this.$emit('dragEnd', {
      position: screenToPoint(ui.position),
      snappedId: getSnappedId(this.dragService)
    })
  }

  mounted () {
    const snapSize = 1

    this.dragService = new DragService(this)
    this.dragService.createDrag({
      snap: ['.snappable', this.snap].join(', '),
      snapMode: 'inner',
      cancel: '.non-draggable',
      grid: [ snapSize, snapSize ],
      start: this.onDragStart,
      drag: this.onDrag,
      stop: this.onDragEnd
    })
  }
}
</script>

<style lang="scss">
.draggable {
  width: 1px;
  height: 1px;
  position: relative;

  &__inner {
    position: absolute;
  }
}
</style>
