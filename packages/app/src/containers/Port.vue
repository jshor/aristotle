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
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import IPoint from '../interfaces/IPoint'
import Draggable from './Draggable.vue'
import PortHandle from '../components/PortHandle.vue'
import PortHelper from '../components/PortHelper.vue'
import PortPivot from '../components/PortPivot.vue'
import getAncestor from '../utils/getAncestor'

export default defineComponent({
  components: {
    Draggable,
    PortHandle,
    PortHelper,
    PortPivot
  },
  props: {
    /**
     * Port ID.
     */
    id: String,

    /**
     * List of sibling ports (all ports on the parent element).
     */
    siblings: {
      type: Object,
      default: () => ({})
    },

    /**
     * Unit circle rotation value (0, 1, 2, 3).
     */
    rotation: {
      type: Number,
      default: 0
    },

    /**
     * Position of the port on the canvas.
     */
    position: {
      type: Object as PropType<IPoint>,
      default: () => ({
        x: 0,
        y: 0
      })
    },

    /**
     * Whether or not the port is draggable.
     */
    draggable: {
      type: Boolean,
      default: false
    },

    /**
     * Whether or not the snap helpers should be enabled.
     * Should be set to true when the port on the opposite end of a connection is being dragged.
     */
    showHelper: {
      type: Boolean,
      default: false
    },

    /**
     * The port type.
     * - 0 = output
     * - 1 = input
     * - 2 = freeport
     */
    type: {
      type: Number,
      default: 0
    },

    /**
     * Port directional orientation.
     */
    orientation: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      /**
       * The temporary ID of the draggable port.
       */
      cloneId: 'DRAGGED_PORT',

      /**
       * The relative dragged position of the dragged port.
       */
      draggablePosition: {
        x: 0,
        y: 0
      } as IPoint,

      /**
       * The absolute position of the dragged port.
       */
      absolutePosition: {
        x: 0,
        y: 0
      } as IPoint
    }
  },
  computed: {
    ...mapGetters([
      'zoom'
    ]),
    ...mapState([
      'activePort'
    ]),

    /**
     * Whether or not this port can accept an incoming dragged port.
     * This will update the UI to make the port bigger when true.
     */
    snappable () {
      return this.activePort !== null // && activePort.type !== this.type
    }
  },
  mounted () {
    window.addEventListener('mouseup', this.mouseup)
  },
  destroy () {
    window.removeEventListener('mouseup', this.mouseup)
  },
  methods: {
    ...mapActions([
      'updatePortPositions',
      'setActivePort',
      'connect',
      'disconnect',
      'showPortSnapHelpers',
      'hidePortSnapHelpers'
    ]),

    /**
     * Sets the absolute position of the static (i.e., not dragged) port.
     */
    setAbsolutePosition () {
      const { x, y } = this.$el.getBoundingClientRect()
      const editor = getAncestor(this, 'canvas')

      this.absolutePosition = editor.fromDocumentToEditorCoordinates({ x, y })
    },

    /**
     * Tells the store to show the snap helpers of ports adjacent to this one.
     */
    mousedown () {
      if (this.type === 2) {
        const siblingIds = Object
          .values(this.siblings)
          .reduce((ids: string[], s: any) => [
            ...ids,
            ...s.map(({ id }) => id)
          ], [])

        this.showPortSnapHelpers(siblingIds)
      }
    },

    /**
     * Tells the store that the port's no longer active, and to hide the helpers.
     */
    mouseup () {
      this.setActivePort(null)
      this.hidePortSnapHelpers()
    },

    /**
     * Initializes the draggable connection.
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

      this.connect({
        source: this.id,
        target: this.cloneId
      })
    },

    /**
     * Updates the store position with the absolute position of the port.
     */
    onDrag ({ position }) {
      if (!position) return
      this.updatePortPositions({
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
    },

    /**
     * Handles terminating the temporary active port, and connects the port to the one at its dragged location.
     * This method handles all results of a user-driven port-dragging interaction.
     */
    dragEnd ({ position, snappedId }) {
      this.draggablePosition = {
        x: 0,
        y: 0
      }
      this.disconnect({
        source: this.id,
        target: this.cloneId
      })
      this.connect({
        source: this.id,
        target: snappedId
      })
      this.setActivePort(null)
    }
  }
})
</script>
