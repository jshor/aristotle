<template>
  <div
    class="oscilloscope-viewer"
  >
    <div
      class="oscilloscope-viewer__touch-resizer"
      ref="resizer"
      @touchstart="onDragStart"
      @touchmove="onTouchMove"
      @touchcancel="onDragEnd"
      @touchend="onDragEnd"
    >
      <div
        class="oscilloscope-viewer__mouse-resizer"
        @mousedown="onDragStart"
      />
    </div>

    <div
      class="oscilloscope-viewer__inner"
      ref="viewer"
      :style="{ height: `${height}px` }"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'

export default defineComponent({
  name: 'OscilloscopeViewer',
  props: {
    /** The height, in pixels, of the oscilloscope viewer. */
    modelValue: {
      type: Number,
      required: true
    }
  },
  emits: {
    'update:modelValue': (height: number) => true
  },
  setup (props, { emit }) {
    const height = ref(props.modelValue)
    const viewer = ref<HTMLElement>()
    const resizer = ref<HTMLElement>()

    let isDragging = false

    onMounted(() => {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onDragEnd)
    })

    onUnmounted(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onDragEnd)
    })

    function onDragStart () {
      isDragging = true
    }

    function onDragEnd () {
      isDragging = false
    }

    function onMouseMove ($event: MouseEvent | Touch) {
      if (!isDragging || !viewer.value) return

      const rect = viewer.value
        .parentElement!
        .parentElement!
        .getBoundingClientRect()

      height.value = Math.max(50, Math.min(rect.height, rect.bottom - $event.clientY))

      emit('update:modelValue', height.value)
    }

    function onTouchMove ($event: TouchEvent) {
      onMouseMove($event.touches[0])
    }

    return {
      onTouchMove,
      onDragStart,
      onDragEnd,
      height,
      viewer,
      resizer
    }
  }
})
</script>

<style lang="scss">
.oscilloscope-viewer {
  position: relative;
  border-top: 1px solid var(--color-bg-secondary);
  background-color: var(--color-bg-primary);
  color: var(--color-primary);
  --resizer-height: #{$resizer-size};

  &__inner {
    display: flex;
    flex-direction: column;
  }

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
