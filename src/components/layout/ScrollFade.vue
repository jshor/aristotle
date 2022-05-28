<template>
  <resizable
    ref="scroll"
    class="scroll-fade"
    :class="{
      'scrollbar-fade--show-scrollbar': !hideScrollbar
    }"
    :style="`--mask-image-content: linear-gradient(to right, ${gradientStyle})`"
    @scroll="onChange"
    @resize="onChange"
  >
    <slot />
  </resizable>
</template>

<script lang="ts">
import { ComponentPublicInstance, defineComponent, onMounted, ref } from 'vue'
import Resizable from '@/components/interactive/Resizable.vue'

export default defineComponent({
  name: 'none',
  components: {
    Resizable
  },
  props: {
    hideScrollbar: {
      type: Boolean,
      default: false
    }
  },
  setup () {
    const left = 'transparent, black var(--mask-width)'
    const right = 'black calc(100% - var(--mask-width)), transparent'
    const scroll = ref<ComponentPublicInstance<HTMLElement>>()
    const gradientStyle = ref('')

    function getGradientStyle (element: HTMLElement) {
      const {
        scrollWidth,
        scrollLeft,
        clientWidth
      } = element

      if (scrollWidth > clientWidth) {
        const modifiers: string[] = []

        if (scrollLeft > 0) modifiers.push(left)
        if (scrollLeft + clientWidth < scrollWidth) modifiers.push(right)

        gradientStyle.value = modifiers.join(', ')
        return modifiers.join(', ')
      }

      return 'transparent transparent'
    }

    function onChange () {
      if (scroll.value) {
        gradientStyle.value = getGradientStyle(scroll.value.$el)
      }
    }

    return {
      onChange,
      gradientStyle,
      scroll
    }
  }
})
</script>

<style lang="scss">
.scroll-fade {
  --mask-width: 1em;
  overflow-x: auto;
  max-width: 100%;

  --mask-size-content: 100% 100%;
  --mask-image-scrollbar: linear-gradient(black, black);
  --mask-size-scrollbar: 0 100%;
  mask-image: var(--mask-image-content), var(--mask-image-scrollbar);
  mask-size: var(--mask-size-content), var(--mask-size-scrollbar);
  mask-position: 0 100%, 0 0;
  mask-repeat: no-repeat, no-repeat;

  &::-webkit-scrollbar {
    display: none;
  }
}

</style>
