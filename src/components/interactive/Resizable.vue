<template>
  <div ref="resizable">
    <slot />
  </div>
</template>

<script lang="ts">
import ResizeObserver from 'resize-observer-polyfill'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'Resizable',
  emits: {
    resize: (rect: DOMRect) => true
  },
  setup (props, { emit }) {
    const resizable = ref<HTMLElement>()

    /**
     * Element resize event handler.
     *
     * @emits `resize` with the new DOMRect of the element
     * @param {ResizeObserverEntry[]} targets - target element that has been resized
     */
    function onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      emit('resize', target.target.getBoundingClientRect())
    }

    const observer = new ResizeObserver(onSizeChanged)

    onMounted(() => {
      observer.observe(resizable.value!)
    })

    return {
      onSizeChanged,
      resizable
    }
  }
})
</script>
