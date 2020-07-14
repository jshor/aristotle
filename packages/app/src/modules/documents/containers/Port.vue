<template>
  <port-pivot :rotation="rotation">
    <div v-if="showHelper">
      <port-helper orientation="horizontal" />
      <port-helper orientation="vertical" />
    </div>

    <draggable
      v-if="draggable"
      :position="draggablePosition"
      :data-id="id"
      :class="{ snappable }"
      snap=".port"
      @drag="onDrag"
      @dragStart="dragStart"
      @dragEnd="dragEnd"
      class="port">
      <port-handle
        :active="snappable"
        @mousedown="mousedown"
        @mouseup="mouseup"
      />
    </draggable>
    <port-handle
      v-else
      :active="snappable"
      @mousedown="mousedown"
      @mouseup="mouseup"
    />
  </port-pivot>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import Draggable from './Draggable.vue'
import PortHandle from '../components/PortHandle.vue'
import PortHelper from '../components/PortHelper.vue'
import PortPivot from '../components/PortPivot.vue'
import { Getter } from '../store/decorators'
import IPoint from '../../../interfaces/IPoint'
import getAncestor from '../../../utils/getAncestor'
import Canvas from './Documents.vue'

@Component({
  components: {
    Draggable,
    PortHandle,
    PortHelper,
    PortPivot
  }
})
export default class Port extends Vue {
  /**
   * Current zoom value of the editor.
   *
   * @type {number}
   */
  @Getter('documents', 'zoom')
  public zoom: number

  /**
   * Port ID.
   *
   * @type {string}
   */
  @Prop()
  public id: string

  /**
   * List of sibling ports (all ports on the parent element).
   *
   * @type {IPort[]}
   */
  @Prop({ default: () => ({}) })
  public siblings: any[]

  /**
   * Unit circle rotation value (0, 1, 2, 3).
   *
   * @type {number}
   */
  @Prop({ default: 0 })
  public rotation: any

  /**
   * Position of the port on the canvas.
   *
   * @type {IPoint}
   */
  @Prop({
    default: () => ({
      x: 0,
      y: 0
    })
  })
  public position: IPoint

  /**
   * Whether or not the port is draggable.
   *
   * @type {boolean}
   */
  @Prop({ default: true })
  public draggable: boolean

  /**
   * Whether or not the snap helpers should be enabled.
   * Should be set to true when the port on the opposite end of a connection is being dragged.
   *
   * @type {boolean}
   */
  @Prop({ default: false })
  public showHelper: boolean

  /**
   * The port type.
   * - 0 = output
   * - 1 = input
   * - 2 = freeport
   *
   * @type {number}
   */
  @Prop({ default: 0 })
  public type: number

  /**
   * Port directional orientation.
   *
   * @type {number}
   */
  @Prop({ default: 0 })
  public orientation: number

  /**
   * The temporary ID of the draggable port.
   *
   * @type {string}
   */
  public cloneId: string = 'DRAGGED_PORT'

  /**
   * The relative dragged position of the dragged port.
   *
   * @type {IPoint}
   */
  public draggablePosition: IPoint = {
    x: 0,
    y: 0
  }

  /**
   * The absolute position of the dragged port.
   *
   * @type {IPoint}
   */
  public absolutePosition: IPoint = {
    x: 0,
    y: 0
  }

  /**
   * Whether or not this port can accept an incoming dragged port.
   * This will update the UI to make the port bigger when true.
   *
   * @type {boolean}
   */
  get snappable () {
    const { activePort } = this.$store.state.documents

    return activePort !== null // && activePort.type !== this.type
  }

  mounted () {
    window.addEventListener('mouseup', this.mouseup)
  }

  destroy () {
    window.removeEventListener('mouseup', this.mouseup)
  }

  /**
   * Sets the absolute position of the static (i.e., not dragged) port.
   */
  setAbsolutePosition () {
    const { x, y } = this.$el.getBoundingClientRect()
    const editor = getAncestor(this, Canvas) as Canvas

    this.absolutePosition = editor.fromDocumentToEditorCoordinates({ x, y })
  }

  /**
   * Tells the store to show the snap helpers of ports adjacent to this one.
   */
  mousedown () {
    if (this.type === 2) {
      const siblingIds = Object
        .values(this.siblings)
        .reduce((ids, s) => [
          ...ids,
          ...s.map(({ id }) => id)
        ], [])

      this.$store.dispatch('showPortSnapHelpers', siblingIds)
    }
  }

  /**
   * Tells the store that the port's no longer active, and to hide the helpers.
   */
  mouseup () {
    this.$store.dispatch('setActivePort', null)
    this.$store.dispatch('hidePortSnapHelpers')
  }

  /**
   * Initializes the draggable connection.
   *
   * @param {}
   */
  dragStart ({ position }) {
    this.setAbsolutePosition()
    this.setActivePort({
      id: this.cloneId,
      position: {
        x: 0,
        y: 0
      },
      type: this.type,
      orientation: this.orientation
    })

    this.draggablePosition = {
      x: NaN,
      y: NaN
    }
    this.onDrag(position)

    this.$store.dispatch('connect', {
      source: this.id,
      target: this.cloneId
    })
  }

  /**
   * Updates the store position with the absolute position of the port.
   *
   * @param {*}
   */
  onDrag ({ position }) {
    if (!position) return
    this.$store.dispatch('updatePortPositions', {
      [this.cloneId]: {
        position: {
          // port coordinates are stored absolutely (relative to its existing position)
          x: position.x + this.absolutePosition.x,
          y: position.y + this.absolutePosition.y
        },
        id: this.cloneId,
        type: this.type,
        orientation: this.orientation,
        rotation: 0
      }
    })
  }

  /**
   * Handles terminating the temporary active port, and connects the port to the one at its dragged location.
   * This method handles all results of a user-driven port-dragging interaction.
   *
   * @param {*}
   */
  dragEnd ({ position, snappedId }) {
    this.draggablePosition = {
      x: 0,
      y: 0
    }
    this.$store.dispatch('disconnect', {
      source: this.id,
      target: this.cloneId
    })
    this.$store.dispatch('connect', {
      source: this.id,
      target: snappedId
    })
    this.$store.dispatch('setActivePort', null)
  }

  /**
   * Tells the store which port is being actively-dragged.
   *
   * @param {Port} port
   */
  setActivePort (port) {
    this.$store.dispatch('setActivePort', port)
  }
}
</script>
