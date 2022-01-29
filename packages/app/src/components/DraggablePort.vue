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

export default defineComponent({
  name: 'DraggablePort',
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
      isDragging: false
    }
  },
  computed: {
    style () {
      return {
        position: 'absolute',
        left: `${this.position.x}px`,
        top: `${this.position.y}px`
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
      const boundaries = this.snapBoundaries as BoundingBox[]
      const position = boundaries.find((xob: BoundingBox) => {
        return Math.sqrt(Math.pow(xob.left - box.left, 2) + Math.pow(xob.top - box.top, 2)) <= d
      })

      this.mousePosition = {
        x: $event.clientX,
        y: $event.clientY
      }

      this.$emit('drag', {
        x: this.position.x + position.left,
        y: this.position.y + position.top
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
