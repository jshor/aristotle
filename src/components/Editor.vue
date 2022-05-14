<template>
  <div
    @mousewheel="mousewheel"
    @mousedown.right="startPanning"
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
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Selector from './Selector.vue'

export default defineComponent({
  name: 'Editor',
  components: {
    Selector
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
    style () {
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
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  },
  destroy () {
    window.removeEventListener('mousemove', this.mousemove)
    window.removeEventListener('mouseup', this.mouseup)
  },
  methods: {
    /**
     * Begins panning the canvas.
     */
    startPanning ($event: MouseEvent) {
      this.panning = true
      this.panStartPosition = {
        x: $event.x - this.offset.x,
        y: $event.y - this.offset.y
      }
      this.originalMousePosition = {
        x: $event.x,
        y: $event.y
      }

      $event.preventDefault()
      $event.stopPropagation()
    },

    /**
     * Handles the moving of the canvas, if in panning mode.
     */
    mousemove ($event: MouseEvent) {
      if (this.panning) {
        this.$emit('pan', {
          x: Math.min($event.x - this.panStartPosition.x, 0),
          y: Math.min($event.y - this.panStartPosition.y, 0)
        })
      }
    },

    /**
     * Terminates panning mode, if panning. This will suppress the context menu if so.
     */
    mouseup ($event: MouseEvent) {
      if ($event.button === 2) {
        const deltaX = Math.abs(this.originalMousePosition.x - $event.x)
        const deltaY = Math.abs(this.originalMousePosition.y - $event.y)

        if (deltaX + deltaY < 2) {
          // if the mouse moved less than 2 pixels in any direction, show the context menu
          this.$emit('onContextMenu', $event)
        }
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

    // Normalize mouse wheel movement to +1 or -1 to avoid unusual jumps.
    const wheel = $event.deltaY < 0 ? 1 : -1;
      const zoom = this.zoom + (wheel/ 10)

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
  height: 100%;
  width: 100%;
  max-width: 100%;
  max-height: 100%;

  &__grid {
    position: relative;
    box-sizing: border-box;
    background-image:
      linear-gradient(to right, var(--color-bg-secondary) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-bg-secondary) 1px, transparent 1px);
    background-color: var(--color-bg-primary);
    transform-origin: top left;
  }
}
</style>
