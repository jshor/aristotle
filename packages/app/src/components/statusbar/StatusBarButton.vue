<template>
  <button
    class="status-bar-button"
    :disabled="disabled"
    :title="title"
    :style="{ width }"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'StatusBarButton',
  props: {
    /** Whether or not to disable the button. */
    disabled: {
      type: Boolean,
      default: false
    },
    /** Tooltip-friendly button text. */
    title: {
      type: String,
      default: ''
    },
    /** Style width. */
    width: {
      type: String,
      default: '2em'
    }
  }
})
</script>

<style lang="scss">
.status-bar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font-family);
  color: var(--color-primary);
  background-color: transparent;
  padding: 0 0.5em;
  box-sizing: border-box;
  border: 0;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:not(:disabled) {
    &:hover {
      background-color: var(--color-bg-quaternary);
    }

    &:active {
      background-color: var(--color-bg-tertiary);
    }
  }
}
</style>
