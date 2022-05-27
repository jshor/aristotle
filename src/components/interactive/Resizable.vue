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
  emits: ['resize'],
  setup (_, { emit }) {
    const resizable = ref<HTMLElement>()

    /**
     * Item resize event handler. This will inform the store of the new size of the item.
     *
     * @param targets - target element that has been resized
     */
    function onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      emit('resize', target.target.getBoundingClientRect())
    }

    const observer = new ResizeObserver(onSizeChanged)

    onMounted(() => {
      if (resizable.value) {
        observer.observe(resizable.value)
      }
    })

    return {
      resizable
    }
  }
})
</script>
