<template>
  <component
    v-bind:is="subtype"
    v-bind="$props"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Lightbulb from './outputs/Lightbulb.vue'

const components = {
  Lightbulb
}

export default defineComponent({
  name: 'OutputNode',
  components,
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    },
    subtype: {
      type: String,
      required: true
    }
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
