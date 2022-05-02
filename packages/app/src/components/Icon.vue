<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="icon"
    :viewBox="`0 0 ${width} ${height}`"
  >
    <path fill="currentColor" :d="(svgPath as string)" />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { IconDefinition } from '@fortawesome/free-solid-svg-icons'

export default defineComponent({
  name: 'Icon',
  props: {
    icon: {
      type: Object as PropType<IconDefinition>,
      required: true
    }
  },
  setup (props) {
    const width = computed(() => props.icon.icon[0])
    const height = computed(() => props.icon.icon[1])
    const svgPath = computed(() => props.icon.icon[4])

    return { width, height, svgPath }
  }
})
</script>

<style lang="scss">
.icon {
  max-width: 100%;
  max-height: 100%;
}
</style>
