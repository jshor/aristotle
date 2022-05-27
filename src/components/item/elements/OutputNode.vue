<template>
  <div
    class="output-node"
    :class="{
      'output-node--on': value === 1,
      'output-node--high-z': value === 0
    }"
  />
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'

export default defineComponent({
  name: 'OutputNode',
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    }
  },
  setup (props) {
    const value = computed(() => props.ports[0]?.value || 0)

    return { value }
  }
})
</script>

<style lang="scss">
.output-node {
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
