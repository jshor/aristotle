<template>
  <div class="lightbulb">
    <div class="lightbulb__wire" />
    <div
      class="lightbulb__bulb"
      :class="`lightbulb__bulb--${modifier}`"
    />
  </div>
</template>

<script lang="ts">
import LogicValue from '@/types/enums/LogicValue'
import Direction from '@/types/enums/Direction'
import { defineComponent, PropType, computed } from 'vue'
import Port from '@/types/interfaces/Port'

export default defineComponent({
  name: 'Lightbulb',
  props: {
    ports: {
      type: Object as PropType<Record<Direction, Port[]>>,
      default: () => {}
    },
  },
  setup (props) {
    const modifier = computed(() => {
      switch (props.ports[Direction.Left]?.[0]?.value) {
        case LogicValue.TRUE:
          return 'on'
        case LogicValue.FALSE:
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
  display: flex;
  width: calc(40px + var(--integrated-circuit-wire-height));
  height: 40px;

  &__wire {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--integrated-circuit-wire-height);

    &::before {
      content: ' ';
      position: absolute;
      height: 2px;
      width: var(--integrated-circuit-wire-height);
      background-color: var(--color-secondary);
    }
  }

  &__bulb {
    width: 40px;
    height: 40px;
    border: 5px solid var(--color-secondary);
    background-color: rgba(67, 67, 67, 0.5);
    border-radius: 50%;
    cursor: move;
    pointer-events: all;
    box-sizing: border-box;

    &--on {
      background-color: var(--color-on);
      box-shadow: 0 0 20px var(--color-on);
    }

    &--high-z {
      background-color: var(--color-hi-z);
    }
  }
}
</style>
