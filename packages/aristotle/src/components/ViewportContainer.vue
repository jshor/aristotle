<template>
  <div
    class="viewport-container"
    ref="container"
    :style="style">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'ViewportContainer',
  computed: {
    style () {
      return {
        left: `${this.position.x - this.offset.x}px`,
        top: `${this.position.y - this.offset.y}px`
      }
    }
  },
  props: {
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    }
  },
  data () {
    return {
      offset: {
        x: 0,
        y: 0
      }
    }
  },
  mounted () {
    this.adjustToFitViewport()
  },
  methods: {
    adjustToFitViewport () {
      const container = this.$refs.container
      const containerRect = container.getBoundingClientRect()
      const parentRect = container.parentNode.getBoundingClientRect()

      if (containerRect.right > parentRect.right) {
        this.offset.x = containerRect.right - parentRect.right
      }

      if (containerRect.bottom > parentRect.bottom) {
        this.offset.y = containerRect.bottom - parentRect.bottom
      }
    }
  }
}
</script>

<style>
.viewport-container {
  position: absolute;
  z-index: 1001;
}
</style>
