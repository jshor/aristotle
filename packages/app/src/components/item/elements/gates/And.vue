<template>
  <svg
    class="and"
    width="100"
    height="50"
    viewBox="0 -1 100 50"
  >
    <path
      transform="translate(20, 0)"
      class="and__element"
      d="M 0 0 V 48 H 24 C 36 48 48 36 48 24 C 48 12 36 0 24 0 Z"
    />
    <circle
      v-if="isNegated"
      cx="73"
      cy="24"
      r="5"
      class="and__negation"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'And',
  props: {
    isNegated: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.and {
  &__element, &__negation {
    stroke-width: 2;
    stroke: $color-secondary;
    fill: $color-bg-secondary;
    pointer-events: all;
  }
}
</style>
