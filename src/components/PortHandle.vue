<template>
  <div class="port-handle">
    <div
      class="port-handle__display"
      :class="{
        'port-handle__display--active': active
      }"
    />
  </div>
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
    },
    type: {
      type: Number,
      default: 0
    }
  }
})
</script>

<style lang="scss">
.port-handle {
  --port-radius: 16px;

  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  top: calc(var(--port-radius) * -1);
  left: calc(var(--port-radius) * -1);
  width: calc(var(--port-radius) * 2);
  height: calc(var(--port-radius) * 2);
  border-radius: 50%;
  pointer-events: all;
  z-index: 1001;

  &__display {
    width: 50%;
    height: 50%;
    border-radius: 50%;
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-secondary);
    transition: all 0.25s;
    cursor: move;

    &--active {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
