<template>
  <div
    @mousedown.left.self="mousedown"
    class="selector"
  >
    <div
      v-if="selection"
      :style="style"
      ref="selection"
      class="selector__selection"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Selector',
  props: {
    zoom: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {
      selection: false,
      start: {
        x: 0,
        y: 0
      } as Point,
      end: {
        x: 0,
        y: 0
      } as Point
    }
  },
  computed: {
    style () {
      const left = Math.min(this.start.x, this.end.x)
      const top = Math.min(this.start.y, this.end.y)
      const width = Math.abs(this.start.x - this.end.x)
      const height = Math.abs(this.start.y - this.end.y)

      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      }
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
    getPosition (event) {
      const { top, left } = (this.$el as any).getBoundingClientRect()
      const x = (event.x - left) / this.zoom
      const y = (event.y - top) / this.zoom

      return { x, y }
    },
    mousedown (event) {
      const position = this.getPosition(event)

      this.selection = true
      this.start = position
      this.end = position

      this.$emit('selectionStart', event)
    },

    mousemove (event) {
      if (this.selection) {
        this.end = this.getPosition(event)
      }
    },

    mouseup (event) {
      if (this.selection) {
        this.createSelection()

        this.selection = false
        this.start.x = 0
        this.start.y = 0
        this.end.x = 0
        this.end.y = 0
      }
    },

    createSelection () {
      this.$emit('selectionEnd', (this.$refs.selection as any).getBoundingClientRect())
    }
  }
})
</script>

<style lang="scss">
.selector {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.selector__selection {
  position: relative;
  border: 1px dashed #808080;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
