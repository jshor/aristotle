<template>
  <div :class="`wire wire--${type}`">
    <div :class="`wire__connector wire__connector--${type}`" />
    <div class="wire__port">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PortWire',
  props: {
    type: {
      type: String,
      default: 'top'
    }
  }
})
</script>

<style lang="scss">
.wire {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &__connector {
    position: absolute;
    background-color: var(--color-secondary);
    width: 2px;
    height: 100%;

    &--left, &--right {
      width: 100%;
      height: 2px;
    }
  }

  &__port {
    position: absolute;
  }

  &--left {
    justify-content: flex-start;
    left: calc(var(--integrated-circuit-wire-height) * -1);
  }

  &--top {
    align-items: flex-start;
    top: calc(var(--integrated-circuit-wire-height) * -1);
  }

  &--bottom {
    align-items: flex-end;
    position: relative;
  }

  &--right {
    justify-content: flex-end;
    right: calc(var(--integrated-circuit-wire-height) * -1);
    left: auto;
  }

  &--left, &--right {
    top: 0;
    width: var(--integrated-circuit-wire-height);
    height: 100%;
  }

  &--top, &--bottom {
    left: 0;
    height: var(--integrated-circuit-wire-height);
    width: 100%;
  }
}
</style>
