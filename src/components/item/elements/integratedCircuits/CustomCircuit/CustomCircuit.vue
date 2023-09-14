<template>
  <div
    class="custom-circuit"
    :class="{
      'custom-circuit--no-left': !ports[Direction.Left].length,
      'custom-circuit--no-right': !ports[Direction.Right].length,
      'custom-circuit--no-top': !ports[Direction.Top].length,
      'custom-circuit--no-bottom': !ports[Direction.Bottom].length
    }"
  >
    <custom-circuit-port-zone
      :ports="ports[Direction.Top]"
      :circuit-name="name"
      orientation="horizontal"
      type="top"
    />

    <div class="custom-circuit__center">
      <custom-circuit-port-zone
        :ports="ports[Direction.Left]"
        :circuit-name="name"
        orientation="vertical"
        type="left"
      />
      <div class="custom-circuit__name">
        {{ name }}
      </div>
      <custom-circuit-port-zone
        :ports="ports[Direction.Right]"
        :circuit-name="name"
        orientation="vertical"
        type="right"
      />
    </div>

    <custom-circuit-port-zone
      :ports="ports[Direction.Bottom]"
      :circuit-name="name"
      orientation="horizontal"
      type="bottom"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import CustomCircuitPortZone from './CustomCircuitPortZone.vue'
import Direction from '@/types/enums/Direction'
import Port from '@/types/interfaces/Port'

export default defineComponent({
  name: 'CustomCircuit',
  components: { CustomCircuitPortZone },
  props: {
    ports: {
      type: Object as PropType<Record<Direction, Port[]>>,
      default: () => {}
    },
    name: {
      type: String,
      default: 'circuit'
    }
  },
  setup () {
    return { Direction }
  }
})
</script>

<style lang="scss">
.custom-circuit {
  border: 1px solid var(--color-secondary);
  // background-color: var(--color-bg-primary);
  background-color: #1D1E25CC;
  pointer-events: all;
  margin: 40px;

  &--no-left {
    margin-left: 0;
  }

  &--no-top {
    margin-top: 0;
  }

  &--no-right {
    margin-right: 0;
  }

  &--no-bottom {
    margin-bottom: 0;
  }

  &__name {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1em;
    color: var(--color-primary);
  }

  &__center {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }

  &__set {
    width: 100%;

    &--horizontal {
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      text-align: center;
    }

    &--vertical {
      display: flex;
      justify-content: space-around;
      flex-direction: column;
    }
  }
}
</style>
