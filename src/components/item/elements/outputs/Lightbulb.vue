<template>
  <div
    class="lightbulb"
    :class="`lightbulb--${modifier}`"
    :title="ports[0]?.value"
  />
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'

export default defineComponent({
  name: 'Lightbulb',
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    }
  },
  setup (props) {
    const modifier = computed(() => {
      switch (props.ports[0]?.value) {
        case 1:
          return 'on'
        case -1:
          return 'off'
        default:
          return 'high-z'
      }
    })

    return { modifier }
  }
})
</script>

<style lang="scss">
.lightbulb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-secondary);
  background-color: rgba(67, 67, 67, 0.5);
  cursor: move;
  pointer-events: all;

  &--on {
    background-color: var(--color-on);
    box-shadow: 0 0 20px var(--color-on);
  }

  &--high-z {
    background-color: var(--color-hi-z);
  }
}
</style>
