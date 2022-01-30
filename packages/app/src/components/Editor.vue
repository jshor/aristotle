<template>
  <div
    @contextmenu="contextMenu($event)"
    @mousewheel="mousewheel"
    @mousedown.right="startPanning"
    class="editor"
  >
    <div
      :style="style"
      ref="editor"
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
import { defineComponent } from 'vue'
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
    }
  },
  computed: {
    style () {
      return {
        backgroundSize: `${this.gridSize}px ${this.gridSize}px`,
        transform: `scale(${this.zoom})`,
        left: `${this.offset.x}px`,
        top: `${this.offset.y}px`
      }
    }
  },
  data () {
    return {
      offset: {
        x: 0,
        y: 0
      } as Point,
      panStartPosition: {
        x: 0,
        y: 0
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
     * Right-click context menu handler.
     */
    contextMenu ($event: MouseEvent) {
      if (this.preventContextMenu) {
        this.preventContextMenu = false
        $event.preventDefault()
        $event.stopPropagation()
      }
    },

    /**
     * Begins panning the canvas.
     */
    startPanning ($event: MouseEvent) {
      this.panning = true
      this.panStartPosition = {
        x: $event.x - this.offset.x,
        y: $event.y - this.offset.y
      }
    },

    /**
     * Handles the moving of the canvas, if in panning mode.
     */
    mousemove ($event: MouseEvent) {
      if (this.panning) {
        this.offset = {
          x: Math.min($event.x - this.panStartPosition.x, 0),
          y: Math.min($event.y - this.panStartPosition.y, 0)
        }
      }
    },

    /**
     * Terminates panning mode, if panning. This will suppress the context menu if so.
     */
    mouseup ($event: MouseEvent) {
      if ($event.button === 2 && (this.panStartPosition.x !== $event.x || this.panStartPosition.y !== $event.y)) {
        this.preventContextMenu = true
      }

      this.panning = false
      this.panStartPosition = { x: 0, y: 0 }
    },

    /**
     * Zooms the editor if the shift key is held down while scrolling with a mouse wheel.
     *
     * @emits `zoom`
     */
    mousewheel ($event: WheelEvent) {
      if (!$event.shiftKey) return

      const zoom = this.zoom + ($event.deltaY / 1000)
      const point = this.fromDocumentToEditorCoordinates({
        x: $event.x,
        y: $event.y
      })
      const scaledPoint = {
        x: point.x * zoom,
        y: point.y * zoom
      }

      this.offset = {
        x: Math.min(point.x - scaledPoint.x, 0),
        y: Math.min(point.y - scaledPoint.y, 0)
      }

      this.$emit('zoom', zoom)
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
    selectionEnd (rect: DOMRect) {
      const point = this.fromDocumentToEditorCoordinates({
        x: rect.x,
        y: rect.y
      })
      const boundingBox: BoundingBox = {
        left: point.x,
        top: point.y,
        right: point.x + rect.width,
        bottom: point.y + rect.height
      }

      this.$emit('selection', boundingBox)
    },

    /**
     * Converts the given point from document coordinates to editor ones.
     */
    fromDocumentToEditorCoordinates (point: Point) {
      const editor = this.$refs.editor as HTMLElement
      const { x, y } = editor.getBoundingClientRect()

      return {
        x: (point.x - x) / this.zoom,
        y: (point.y - y) / this.zoom
      }
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
    width: 300vw;
    height: 300vh;
    background-image:
      linear-gradient(to right, #c0c0c0 1px, transparent 1px),
      linear-gradient(to bottom, #c0c0c0 1px, transparent 1px);
    background-color: #e8e8e8;
    transform-origin: top left;
  }
}
</style>
