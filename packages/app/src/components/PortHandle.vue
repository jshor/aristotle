<template>
  <div
    class="port-handle"
    :class="{
      'port-handle--active': active
    }"
    @mousedown="mousedown"
    @mouseup="mouseup"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PortHandle',
  props: {
  /**
   * Sets the port handle to be visually active.
   */
    active: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /**
     * Wrapper for the `mousedown` event.
     */
    mousedown (event: MouseEvent) {
      this.$emit('mousedown', event)
    },

    /**
     * Wrapper for the `mouseup` event.
     */
    mouseup (event: MouseEvent) {
      this.$emit('mouseup', event)
    }
  }
})
</script>

<style lang="scss">
.port-handle {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid black;
  box-sizing: border-box;
  top: -8px;
  left: -8px;
  width: 16px;
  height: 16px;
  background-color: red;
  border-radius: 50%;
  cursor: grab;
  transition: all 0.25s;
  z-index: 1001;

  &:active {
    cursor: grabbing;
  }

  &--active {
    width: 24px;
    height: 24px;
    top: -12px;
    left: -12px;
  }
}
</style>
