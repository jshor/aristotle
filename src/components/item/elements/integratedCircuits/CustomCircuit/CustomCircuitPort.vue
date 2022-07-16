<template>
  <div class="custom-circuit-port">
    <div class="custom-circuit-port__label">
      {{ label }}
    </div>
    <port-wire :type="type" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import PortWire from '@/components/port/PortWire.vue'

export default defineComponent({
  name: 'CustomCircuitPort',
  components: { PortWire },
  props: {
    label: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      required: true
    }
  }
})
</script>

<style lang="scss">
.custom-circuit-port {
  position: relative;
  display: inline-block;
  height: 100%;
  vertical-align: middle;

  &__label {
    font-family: var(--font-family);
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    height: 100%;
    font-size: 1em;
    max-width: 20vw;
    padding: 0 0.25em;
    margin: 0;
    border: 0;
    background-color: transparent;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--hidden {
      opacity: 0;
    }
  }
}
</style>
