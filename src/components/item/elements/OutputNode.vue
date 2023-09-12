<template>
  <component
    v-bind:is="subtype"
    v-bind="$props"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Lightbulb from './outputs/Lightbulb.vue'
import Direction from '@/types/enums/Direction';
import Port from '@/types/interfaces/Port';

const components = {
  Lightbulb
}

export default defineComponent({
  name: 'OutputNode',
  components,
  props: {
    ports: {
      type: Object as PropType<Record<Direction, Port[]>>,
      default: () => {}
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
