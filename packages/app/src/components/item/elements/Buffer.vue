<template>
  <svg
    width="60"
    height="50"
    viewBox="0 -1 60 50"
    class="buffer"
  >
    <path
      transform="translate(20, 0)"
      class="buffer__element"
      fill="#fff"
      d="M 0 0 V 48 L 36 24 Z"
    />
    <circle
      v-if="isNegated"
      class="buffer__negation"
      cx="68"
      cy="24"
      r="5"
      fill="#fff"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Buffer',
  props: {
    isNegated: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.buffer {
  box-sizing: border-box;

  &__element, &__negation {
    stroke-width: 2;
    stroke: #000;
    fill: #fff;
    pointer-events: all;
  }
}
</style>
