<template>
  <button
    class="modal-button"
    role="button"
    :class="{
      'modal-button--inverted': inverted,
      'modal-button--block': block
    }"
  >
    {{ text }}
  </button>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  /** Button text to display. */
  text: string
  /** Whether or not the button is disabled. */
  disabled?: boolean
  /** Whether or not to display the button as transparent with an outline. */
  inverted?: boolean
  /** Whether or not to display a full-width button. */
  block?: boolean
}>(), {
  disabled: false,
  inverted: false,
  block: false
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
  margin-top: 1em;

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
      background-color: var(--color-primary);
      color: var(--color-bg-primary);
    }

    &:active {
      background-color: var(--color-secondary);
      color: var(--color-bg-primary);
    }
  }

  &--block {
    display: block;
    width: 100%;
    margin-left: 0;
  }
}

</style>
