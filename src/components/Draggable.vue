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
    zoom: {
      type: Number,
      default: 1
    },
    snapMode: {
      type: String,
      default: 'outer'
    },
    snapBoundaries: {
      type: Array,
      default: () => []
    },
    boundingBox: {
      type: Object as PropType<BoundingBox>,
      default: () => ({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      })
    },
    isDraggable: {
      type: Boolean,
      default: true
    },
    forceDragging: {
      type: Boolean,
      default: false
    },
    lockVisual: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      mousePosition: {
        x: 0,
        y: 0
      } as Point,
      apparentPosition: {
        x: 0,
        y: 0
      } as Point,
      truePosition: {
        x: 0,
        y: 0
      } as Point,
      realPositionFromStore: {
        x: 0,
        y: 0
      } as Point,
      box: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      } as BoundingBox,
      isDragging: false,
      hasEmittedDrag: false,
      isRadialSnap: false
    }
  },
  watch: {
    position: {
      handler (position: Point) {
        this.realPositionFromStore = position

        if (!this.isDragging) {
          this.truePosition = position
        }
      },
      immediate: true
    },
    boundingBox: {
      handler () {
        if (!this.isDragging) {
          this.apparentPosition = this.truePosition
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
    style (): StyleValue {
      if (this.lockVisual) {
        return {}
      }

      return {
        position: 'absolute',
        pointerEvents: 'none',
        left: `${this.apparentPosition.x || this.truePosition.x}px`,
        top: `${this.apparentPosition.y || this.truePosition.y}px`
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
    initDragging (x: number, y: number) {
      if (!this.isDraggable) return

      this.mousePosition = { x, y }
      this.box = {
        left: this.boundingBox.left,
        top: this.boundingBox.top,
        right: this.boundingBox.right,
        bottom: this.boundingBox.bottom
      }
      this.apparentPosition = {
        x: this.truePosition.x,
        y: this.truePosition.y
      }
      this.isDragging = true
      this.hasEmittedDrag = false
    },

    getScaledDelta ($event: MouseEvent) {
      return {
        x: ($event.x - this.mousePosition.x) / this.zoom,
        y: ($event.y - this.mousePosition.y) / this.zoom
      }
    },

    keydown ($event: KeyboardEvent) {
      if ($event.key.toUpperCase() === 'Z' && $event.ctrlKey && this.isDragging) {
        this.isDragging = false
        this.truePosition = this.realPositionFromStore
      }
    },

    mousedown ($event: MouseEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      this.initDragging($event.clientX, $event.clientY)
    },

    mousemove ($event: MouseEvent) {
      if (!this.isDragging || !this.isDraggable) return

      if (!this.hasEmittedDrag) {
        this.hasEmittedDrag = true
        this.$emit('dragStart')
      }

      const delta = this.getScaledDelta($event)

      const d = 15
      this.box = {
        left: this.box.left + delta.x,
        top: this.box.top + delta.y,
        right: this.box.right + delta.x,
        bottom: this.box.bottom + delta.y
      }
      const box = this.box
      const boundaries = this.snapBoundaries as BoundingBox[]
      const offset: Point = {
        x: 0,
        y: 0
      }
      let snapPosition: Point | null = null

      boundaries.forEach((xob: BoundingBox) => {
        if (this.snapMode === 'radius') {
          const isWithin = Math.sqrt(Math.pow(xob.left - box.left, 2) + Math.pow(xob.top - box.top, 2)) <= d

          if (isWithin) {
            offset.x = xob.left - box.left
            offset.y = xob.top - box.top

            snapPosition = {
              x: xob.left,
              y: xob.top
            }
            return
          }
        }

        const ts = Math.abs(xob.top - box.bottom) <= d
        const bs = Math.abs(xob.bottom - box.top) <= d
        const ls = Math.abs(xob.left - box.right) <= d
        const rs = Math.abs(xob.right - box.left) <= d

        if (
          (box.left <= xob.right && box.left >= xob.left) ||
          (box.right >= xob.left && box.right <= xob.right) ||
          (box.left <= xob.left && box.right >= xob.right)
        ) {
          // box is within the y-axis boundaries
          if (ts) offset.y = xob.top - box.bottom
          if (bs) offset.y = xob.bottom - box.top
        }

        if (
          (box.top <= xob.bottom && box.top >= xob.top) ||
          (box.bottom >= xob.top && box.bottom <= xob.bottom) ||
          (box.top <= xob.top && box.bottom >= xob.bottom)
        ) {
          // box is within the x-axis boundaries
          if (ls) offset.x = xob.left - box.right
          if (rs) offset.x = xob.right - box.left
        }
      })

      this.mousePosition = {
        x: $event.clientX,
        y: $event.clientY
      }
      this.apparentPosition = {
        x: this.truePosition.x + delta.x + offset.x,
        y: this.truePosition.y + delta.y + offset.y,
      }
      this.truePosition = {
        x: this.truePosition.x + delta.x,
        y: this.truePosition.y + delta.y
      }

      if (snapPosition) {
        this.$emit('drag', snapPosition)
      } else {
        this.$emit('drag', {
          x: this.apparentPosition.x,
          y: this.apparentPosition.y
        })
      }
    },

    mouseup ($event: MouseEvent) {
      if (!this.isDraggable) return

      this.isDragging = false
      this.truePosition = this.realPositionFromStore
      this.$emit('dragEnd', {
        delta: this.getScaledDelta($event)
      })
    }
  }
})
</script>
