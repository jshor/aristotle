<template>
  <div class="port-handle">
    <div
      class="port-handle__display"
      :class="{
        'port-handle__display--active': active
      }"
    >
      <div
        class="port-handle__hue"
        :style="{ backgroundColor }"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'PortHandle',
  props: {
    /** Sets the port handle to be visually active. */
    active: {
      type: Boolean,
      default: false
    },

    /** Color hue of the port. */
    hue: {
      type: Number,
      default: 0
    }
  },
  setup (props) {
    const backgroundColor = computed(() => {
      return props.hue > 0
        ? `hsla(${props.hue}, var(--lightness), var(--saturation), 0.8)`
        : 'var(--color-bg-secondary)'
    })

    return { backgroundColor }
  }
})
</script>

<style lang="scss">
.port-handle {
  --port-radius: 16px;

  position: absolute;
  box-sizing: border-box;
  top: calc(var(--port-radius) * -1);
  left: calc(var(--port-radius) * -1);
  width: calc(var(--port-radius) * 2);
  height: calc(var(--port-radius) * 2);
  border-radius: 50%;
  pointer-events: all;
  z-index: 1001;

  &, &__display {
    display: flex;
    justify-content: center;
    align-items: center;
  }

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
      z-index: 9999;
    }
  }

  &__hue {
    width: 50%;
    height: 50%;
    border-radius: 50%;
  }
}
</style>
