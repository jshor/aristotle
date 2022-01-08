<template>
  <div
    class="port-helper snappable"
    :class="`port-helper--${orientation}`"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PortHelper',
  props: {
  /**
   * Sets the visual orientation for the port snap helper.
   */
    orientation: {
      type: String,
      default: 'horizontal'
    }
  }
})
</script>

<style lang="scss">
.port-helper {
  content: ' ';
  display: block;
  position: absolute;
  background-color: red;

  &--vertical {
    width: 1px;
    left: -1px;
    top: -200vh;
    height: 400vh;
  }

  &--horizontal {
    height: 1px;
    left: -200vh;
    width: 400vh;
  }
}
</style>
