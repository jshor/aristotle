<template>
  <resizable
    @mousewheel="mousewheel"
    @mousedown.right="onMouseDown"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @resize="rect => $emit('resize', rect)"
    class="editor"
  >
    <div
      :style="style"
      class="editor__grid"
    >
      <selector
        :zoom="zoom"
        @selection-start="selectionStart"
        @selection-end="selectionEnd"
      />
      <slot />
    </div>
  </resizable>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue'
import Selector from './Selector.vue'
import Resizable from '../interactive/Resizable.vue'

export default defineComponent({
  name: 'Editor',
  emits: [
    'resize',
    'pan',
    'selection',
    'deselect',
    'zoom',
    'contextmenu'
  ],
  components: {
    Selector,
    Resizable
},
  props: {
    zoom: {
      type: Number,
      default: 1
    },
    gridSize: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    offset: {
      type: Object as PropType<Point>,
      default: () => ({ x: 0, y: 0 })
    }
  },
  computed: {
    style (): StyleValue {
      return {
        backgroundSize: `${this.gridSize}px ${this.gridSize}px`,
        transform: `scale(${this.zoom})`,
        left: `${this.offset.x}px`,
        top: `${this.offset.y}px`,
        width: `${this.width}px`,
        height: `${this.height}px`,
      }
    }
  },
  data () {
    return {
      panStartPosition: {
        x: 0,
        y: 0
      } as Point,
      originalMousePosition: {
        y: 0,
        x: 0
      } as Point,
      panning: false,
      preventContextMenu: false
    }
  },
  mounted () {
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
  },
  destroy () {
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  },
  methods: {
    onMouseDown ($event: MouseEvent) {
      this.startPanning($event.x, $event.y)

      $event.preventDefault()
      $event.stopPropagation()
    },

    onTouchStart ($event: TouchEvent) {
      const { clientX, clientY } = $event.touches[0]

      this.startPanning(clientX, clientY)

      $event.preventDefault()
      $event.stopPropagation()
    },

    onMouseMove ($event: MouseEvent) {
      this.pan($event.x, $event.y)
    },

    onTouchMove ($event: TouchEvent) {
      const { clientX, clientY } = $event.touches[0]

      this.pan(clientX, clientY)
    },

    /**
     * Begins panning the canvas.
     */
    startPanning (x: number, y: number) {
      this.panning = true
      this.panStartPosition = {
        x: x - this.offset.x,
        y: y - this.offset.y
      }
      this.originalMousePosition = { x, y }
    },

    /**
     * Handles the moving of the canvas, if in panning mode.
     */
    pan (x: number, y: number) {
      if (this.panning) {
        this.$emit('pan', {
          x: Math.min(x - this.panStartPosition.x, 0),
          y: Math.min(y - this.panStartPosition.y, 0)
        })
      }
    },

    hasPannedSubstantially (x: number, y: number) {
      const deltaX = Math.abs(this.originalMousePosition.x - x)
      const deltaY = Math.abs(this.originalMousePosition.y - y)

      return deltaX + deltaY < 2
    },

    /**
     * Terminates panning mode, if panning. This will suppress the context menu if so.
     */
    onMouseUp ($event: MouseEvent) {
      if (!this.panning) return

      if ($event.button === 2) {
        if (this.hasPannedSubstantially($event.x, $event.y)) {
          // if the mouse moved less than 2 pixels in any direction, show the context menu
          this.$emit('contextmenu', $event)

          $event.stopPropagation()
          $event.preventDefault()
        }
      }

      this.panning = false
    },

    onTouchEnd ($event: TouchEvent) {
      const { clientX, clientY } = $event.changedTouches[0]

      if (this.hasPannedSubstantially(clientX, clientY)) {
        this.$emit('deselect')
      }

      this.panning = false
    },

    /**
     * Zooms the editor if the shift key is held down while scrolling with a mouse wheel.
     *
     * @emits `zoom`
     */
    mousewheel ($event: WheelEvent) {
      if (!$event.shiftKey) return

      // normalize mouse wheel movement to +1 or -1 to avoid unusual jumps
      const wheel = $event.deltaY < 0 ? 1 : -1
      const zoom = this.zoom + (wheel / 10)

      this.$emit('zoom', { zoom, point: $event })
    },

    /**
     * Deselects all elements if the shift key is not held down when the editor is clicked.
     *
     * @emits `deselect`
     */
    selectionStart ($event: MouseEvent) {
      if (!$event.shiftKey) {
        this.$emit('deselect')
      }
    },

    /**
     * Ends the drag selection.
     *
     * @emits `selection`
     */
    selectionEnd (boundary: BoundingBox) {
      this.$emit('selection', boundary)
    }
  }
})
</script>

<style lang="scss">
.editor {
  overflow: hidden;

  &__grid {
    position: relative;
    box-sizing: border-box;
    transform-origin: top left;
    background-color: var(--color-bg-primary);
    background-image:
      linear-gradient(to right, var(--color-bg-secondary) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-bg-secondary) 1px, transparent 1px);
  }
}
</style>
