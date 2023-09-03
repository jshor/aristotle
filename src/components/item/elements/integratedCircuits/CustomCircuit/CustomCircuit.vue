<template>
  <div class="custom-circuit">
    <custom-circuit-port-zone
      :ports="ports.filter(p => p.orientation === 1)"
      orientation="horizontal"
      type="top"
    />

    <div class="custom-circuit__center">
      <custom-circuit-port-zone
        :ports="ports.filter(p => p.orientation === 0)"
        orientation="vertical"
        type="left"
      />
      <div class="custom-circuit__name">
        {{ name }}
      </div>
      <custom-circuit-port-zone
        :ports="ports.filter(p => p.orientation === 2)"
        orientation="vertical"
        type="right"
      />
    </div>

    <custom-circuit-port-zone
      :ports="ports.filter(p => p.orientation === 3)"
      orientation="horizontal"
      type="bottom"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import CustomCircuitPortZone from './CustomCircuitPortZone.vue'

export default defineComponent({
  name: 'CustomCircuit',
  components: { CustomCircuitPortZone },
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    },
    name: {
      type: String,
      default: 'circuit'
    }
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
