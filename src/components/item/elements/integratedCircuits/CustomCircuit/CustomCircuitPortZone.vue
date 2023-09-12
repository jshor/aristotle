<template>
  <div
    :class="`custom-circuit-port-zone custom-circuit-port-zone--${orientation}`"
  >
    <div
      v-for="port in ports"
      :key="port.id"
      :class="`custom-circuit-port-zone__io--${type}`"
      class="custom-circuit-port-zone__io"
    >
      <custom-circuit-port
        :label="port.name"
        :type="type"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import CustomCircuitPort from './CustomCircuitPort.vue'
import Port from '@/types/interfaces/Port'

export default defineComponent({
  name: 'CustomCircuitPortZone',
  components: { CustomCircuitPort },
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    },
    orientation: {
      type: String as PropType<'horizontal' | 'vertical'>,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  }
})
</script>

<style lang="scss">
.custom-circuit-port-zone {
  width: 100%;

  &__io {
    box-sizing: border-box;
    position: relative;
    overflow: visible;
    display: inline-block;
    height: var(--integrated-circuit-wire-height);

    &--right {
      text-align: right;
    }
  }

  &--horizontal {
    display: grid !important;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    text-align: center;
    height: var(--integrated-circuit-wire-height);
  }

  &--vertical {
    display: flex !important;
    justify-content: space-around;
    flex-direction: column;
    min-height: var(--integrated-circuit-wire-height);
  }
}
</style>
