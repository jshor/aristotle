<template>
  <div
    :style="style"
    @mousedown="mousedown"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue'
import boundaries from '@/utils/geometry/boundaries'
import SnapMode from '@/types/enums/SnapMode'

export default defineComponent({
  name: 'Draggable',
  props: {
    position: {
      type: Object as PropType<Point>,
      default: () => ({
        x: 0,
        y: 0
      })
    },
    /** Canvas zoom, as a decimal factor [0.0, 1.0] */
    zoom: {
      type: Number,
      default: 1
    },
    /** Mode for snapping elements. */
    snapMode: {
      type: Number as PropType<SnapMode>,
      default: SnapMode.None
    },
    /** The available bounding boxes that can snap its position to. */
    snapBoundaries: {
      type: Object as PropType<BoundingBox[]>,
      default: () => []
    },
    /** Rounding distance for snapping behavior. If SnapMode is Grid, this should be the grid size. */
    snapDistance: {
      type: Number,
      default: 15 // TODO: use a constant
    },
    /** The canvas-oriented bounding box of this element. */
    boundingBox: {
      type: Object as PropType<BoundingBox>,
      default: () => ({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      })
    },
    /** Whether or not the element can be dragged around. */
    isDraggable: {
      type: Boolean,
      default: true
    },
    /** Makes the element always follow the cursor when true. */
    forceDragging: {
      type: Boolean,
      default: false
    },
    /** If true, keeps the visual element in the same place while still keeping track of its drag. */
    lockVisual: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      /** The actual position of the mouse on the window document. */
      mousePosition: {
        x: 0,
        y: 0
      } as Point,
      /** The visually-apparent position of the element on the canvas. */
      apparentPosition: {
        x: 0,
        y: 0
      } as Point,
      /** The starting position of the element on the canvas. */
      initialPosition: {
        x: 0,
        y: 0
      } as Point,
      /** Copy of the `position` prop that can be mutated locally. */
      clonedPosition: {
        x: 0,
        y: 0
      } as Point,
      /** A temporary bounding box, augmented by the drag delta during a drag session. */
      draggedBoundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      } as BoundingBox,
      /** Whether or not the element is currently being dragged by the user. */
      isDragging: false,
      /** Whether or not `dragStart` has been emitted for the current drag session. */
      hasEmittedDrag: false
    }
  },
  watch: {
    position: {
      handler (position: Point) {
        this.clonedPosition = position

        if (!this.isDragging) {
          this.initialPosition = position
        }
      },
      immediate: true
    },
    boundingBox: {
      handler () {
        if (!this.isDragging) {
          this.apparentPosition = this.initialPosition
        }
      }
    },
    forceDragging: {
      handler (forceDragging: boolean) {
        if (forceDragging) {
          const { top, left } = this.$el.getBoundingClientRect()

          this.initDragging(left, top)
        }
      }
    }
  },
  computed: {
    /**
     * The visual style representation of the element.
     */
    style (): StyleValue {
      if (this.lockVisual) {
        return {}
      }

      return {
        position: 'absolute',
        pointerEvents: 'none',
        left: `${this.apparentPosition.x || this.initialPosition.x}px`,
        top: `${this.apparentPosition.y || this.initialPosition.y}px`
      }
    }
  },
  mounted () {
    document.addEventListener('mousemove', this.mousemove)
    document.addEventListener('mouseup', this.mouseup)
    document.addEventListener('keydown', this.keydown)
  },
  beforeUnmount () {
    document.removeEventListener('mousemove', this.mousemove)
    document.removeEventListener('mouseup', this.mouseup)
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    /**
     * Updates draggable positions for the given point.
     */
    initDragging (x: number, y: number) {
      if (!this.isDraggable) return

      this.mousePosition = { x, y }
      this.draggedBoundingBox = {
        left: this.boundingBox.left,
        top: this.boundingBox.top,
        right: this.boundingBox.right,
        bottom: this.boundingBox.bottom
      }
      this.apparentPosition = {
        x: this.initialPosition.x,
        y: this.initialPosition.y
      }
      this.isDragging = true
      this.hasEmittedDrag = false
    },

    /**
     * Returns the scaled point of the given mouse event.
     */
    getScaledDelta ($event: MouseEvent): Point {
      return {
        x: ($event.x - this.mousePosition.x) / this.zoom,
        y: ($event.y - this.mousePosition.y) / this.zoom
      }
    },

    /**
     * Keydown event handler.
     * Intended to halt/reset dragging if the user initiates CTRL+Z/CTRL+Shift+Z.
     */
    keydown ($event: KeyboardEvent) {
      if ($event.key.toUpperCase() === 'Z' && $event.ctrlKey && this.isDragging) {
        this.isDragging = false
        this.initialPosition = this.clonedPosition
      }
    },

    /**
     * Mouse down event handler. This will begin the dragging session.
     */
    mousedown ($event: MouseEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      this.initDragging($event.clientX, $event.clientY)
    },

    /**
     * Mouse move event handler.
     * This will update all relevant positions according to the drag delta.
     * This will augment the delta by any remaining distance if the element can be snapped to another element.
     *
     * @emits dragStart the first instance this is called during a drag session
     * @emits drag each time this method is invoked during a drag session
     */
    mousemove ($event: MouseEvent) {
      if (!this.isDragging || !this.isDraggable) return

      if (!this.hasEmittedDrag) {
        this.hasEmittedDrag = true
        this.$emit('dragStart')
      }

      const delta = this.getScaledDelta($event)

      this.draggedBoundingBox = {
        left: this.draggedBoundingBox.left + delta.x,
        top: this.draggedBoundingBox.top + delta.y,
        right: this.draggedBoundingBox.right + delta.x,
        bottom: this.draggedBoundingBox.bottom + delta.y
      }

      const offset = (() => {
        switch (this.snapMode) {
          case SnapMode.Radial:
            return boundaries.getRadialSnapOffset(this.snapBoundaries, this.draggedBoundingBox, this.snapDistance)
          case SnapMode.Grid:
            return boundaries.getGridSnapPosition(this.draggedBoundingBox, this.snapDistance)
          case SnapMode.Outer:
          default:
            return boundaries.getOuterSnapOffset(this.snapBoundaries, this.draggedBoundingBox, this.snapDistance)
        }
      })()

      let snapPosition: Point | null = null

      if (offset.x || offset.y) {
        snapPosition = {
          x: offset.x + this.draggedBoundingBox.left,
          y: offset.y + this.draggedBoundingBox.top
        }
      }

      this.mousePosition = {
        x: $event.clientX,
        y: $event.clientY
      }
      this.apparentPosition = {
        x: this.initialPosition.x + delta.x + offset.x,
        y: this.initialPosition.y + delta.y + offset.y,
      }
      this.initialPosition = {
        x: this.initialPosition.x + delta.x,
        y: this.initialPosition.y + delta.y
      }

      this.$emit('drag', snapPosition || this.apparentPosition)
    },

    /**
     * Mouse up event handler.
     * This terminates the dragging session.
     *
     * @emits dragEnd
     */
    mouseup ($event: MouseEvent) {
      if (!this.isDraggable) return

      this.isDragging = false
      this.initialPosition = this.clonedPosition
      this.$emit('dragEnd', {
        delta: this.getScaledDelta($event)
      })
    }
  }
})
</script>
