<template>
  <div
    :style="style"
    @mousedown="mousedown"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import IPoint from '../interfaces/IPoint'

export default defineComponent({
  name: 'Draggable',
  props: {
    position: {
      type: Object as PropType<IPoint>,
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
      type: Object,
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
    }
  },
  data () {
    return {
      mousePosition: {
        x: 0,
        y: 0
      } as IPoint,
      apparentPosition: {
        x: 0,
        y: 0
      } as IPoint,
      truePosition: {
        x: 0,
        y: 0
      } as IPoint,
      realPositionFromStore: {
        x: 0,
        y: 0
      } as IPoint,
      box: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      isDragging: false
    }
  },
  watch: {
    position: {
      handler (position) {
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
      handler (forceDragging) {
        if (forceDragging) {
          const { top, left } = this.$el.getBoundingClientRect()

          this.initDragging(left, top)
        }
      }
    }
  },
  computed: {
    style () {
      return {
        left: `${this.apparentPosition.x || this.truePosition.x}px`,
        top: `${this.apparentPosition.y || this.truePosition.y}px`
      }
    }
  },
  mounted () {
    document.addEventListener('mousemove', this.mousemove)
    document.addEventListener('mouseup', this.mouseup)
  },
  beforeUnmount () {
    document.removeEventListener('mousemove', this.mousemove)
    document.removeEventListener('mouseup', this.mouseup)
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
      this.$emit('dragStart')
    },

    getScaledDelta ($event: MouseEvent) {
      return {
        x: ($event.x - this.mousePosition.x) / this.zoom,
        y: ($event.y - this.mousePosition.y) / this.zoom
      }
    },

    mousedown ($event: MouseEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      this.initDragging($event.clientX, $event.clientY)
    },

    mousemove ($event: MouseEvent) {
      if (!this.isDragging || !this.isDraggable) return

      const delta = this.getScaledDelta($event)

      const d = 15
      this.box = {
        left: this.box.left + delta.x,
        top: this.box.top + delta.y,
        right: this.box.right + delta.x,
        bottom: this.box.bottom + delta.y
      }
      const box = this.box
      const offset = {
        x: 0,
        y: 0
      }

      this
        .snapBoundaries
        .forEach((xob: any) => {
          if (this.snapMode === 'radius') {
            const isWithin = Math.sqrt(Math.pow(xob.left - box.left, 2) + Math.pow(xob.top - box.top, 2)) <= d

            if (isWithin) {
              offset.x = xob.left - box.left
              offset.y = xob.top - box.top

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
      this.$emit('drag', {
        x: this.apparentPosition.x - this.realPositionFromStore.x,
        y: this.apparentPosition.y - this.realPositionFromStore.y
      })
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
