<template>
  <svg
    width="100"
    height="50"
    viewBox="0 -1 100 50"
    class="or"
  >
    <path
      transform="translate(10, 0)"
      fill="#fff"
      d="M 0 0 C 12 12 12 36 0 48 H 0 H 24 C 48 48 60 36 72 24 C 60 12 48 0 24 0 Z"
      class="or__element"
    />
    <path
      v-if="isXor"
      fill="none"
      d="M 0 0 C 12 12 12 36 0 48"
      class="or__tail"
    />
    <circle
      v-if="isNegated"
      cx="88"
      cy="24"
      r="5"
      class="or__negation"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Or',
  props: {
    isNegated: {
      type: Boolean,
      default: false
    },
    isXor: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.or {
  &__element, &__negation, &__tail {
    stroke-width: 2;
    stroke: $color-secondary;
  }

  &__element, &__negation {
    fill: $color-bg-secondary;
    pointer-events: all;
  }
}
</style>
