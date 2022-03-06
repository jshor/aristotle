<template>
  <svg
    width="100"
    height="50"
    viewBox="0 -1 100 50"
  >
    <path
      transform="translate(40, 0)"
      stroke="#000"
      stroke-width="2"
      fill="#fff"
      d="M 0 0 V 48 L 36 24 Z"
    />
    <circle
      v-if="isNegated"
      stroke="#000"
      stroke-width="2"
      cx="88"
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
svg {
  // border: 1px solid green;
  position: absolute;
  box-sizing: border-box;

  path {
    pointer-events: all;
  }
}
</style>
