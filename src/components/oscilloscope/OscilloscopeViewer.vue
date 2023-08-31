<template>
  <div
    ref="viewer"
    class="oscilloscope-viewer"
    :style="{ height: `${height}px` }"
  >
    <div
      class="oscilloscope-viewer__touch-resizer"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchcancel="onMouseUp"
      @touchend="onMouseUp"
    >
      <div
        class="oscilloscope-viewer__mouse-resizer"
        @mousedown="onMouseDown"
      />
    </div>

    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'

export default defineComponent({
  name: 'OscilloscopeViewer',
  props: {
    collapseHeight: {
      type: Number,
      default: 20
    },
    modelValue: {
      type: Number,
      required: true
    }
  },
  setup (props, { emit }) {
    const height = ref(props.modelValue)
    const viewer = ref<HTMLElement>()

    let originalY = 0
    let currentY = 0
    let isDragging = false

    function onMouseDown ($event: MouseEvent | Touch) {
      originalY = height.value
      currentY = $event.clientY
      isDragging = true
    }

    function onTouchStart ($event: TouchEvent) {
      onMouseDown($event.touches[0])
    }

    function onMouseMove ($event: MouseEvent | Touch) {
      if (!isDragging || !viewer.value) return

      const rect = viewer.value.parentElement?.getBoundingClientRect()

      height.value += Math.min(currentY - $event.clientY, rect?.height || Infinity)
      currentY = $event.clientY

      if (height.value <= props.collapseHeight) {
        emit('collapse', originalY)
      } else {
        emit('update:modelValue', height.value)
      }
    }

    function onTouchMove ($event: TouchEvent) {
      onMouseMove($event.touches[0])
    }

    function onMouseUp () {
      isDragging = false
    }

    onMounted(() => {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    })

    onUnmounted(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })

    return {
      onMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchMove,
      height,
      viewer
    }
  }
})
</script>

<style lang="scss">
.oscilloscope-viewer {
  display: flex;
  flex-direction: column;
  position: relative;
  border-top: 1px solid var(--color-bg-secondary);
  background-color: var(--color-bg-primary);
  color: var(--color-primary);
  --resizer-height: 1em;

  &__touch-resizer {
    position: absolute;
    display: flex;
    align-items: center;
    width: 100%;
    top: calc(var(--resizer-height) / -2);
    height: var(--resizer-height);
    max-height: var(--resizer-height);
    min-height: var(--resizer-height);
  }

  &__mouse-resizer {
    height: calc(var(--resizer-height) / 2);
    max-height: calc(var(--resizer-height) / 2);
    min-height: calc(var(--resizer-height) / 2);
    width: 100%;
    transition: 0.5s all;
    cursor: ns-resize;

    &:hover {
      background-color: var(--color-primary);
    }
  }
}
</style>
