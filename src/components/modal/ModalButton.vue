<template>
  <button
    class="modal-button"
    role="button"
    :class="{
      'modal-button--inverted': inverted
    }"
  >
    {{ text }}
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ModalButton',
  props: {
    text: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    inverted: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.modal-button {
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  color: var(--color-bg-primary);
  border-radius: 2px;
  padding: 0.5em 1em;
  font-size: 1em;
  cursor: pointer;
  font-family: var(--font-family);
  transition: background-color 0.25s;
  margin-left: 1em;

  &:hover {
    background-color: var(--color-bg-primary);
    color: var(--color-primary);
  }

  &:active {
    background-color: var(--color-bg-tertiary);
    color: var(--color-primary);
  }

  &--inverted {
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);

    &:hover {
      background-color: var(--color-bg-secondary);
    }

    &:active {
      background-color: var(--color-bg-tertiary);
    }
  }
}

</style>
