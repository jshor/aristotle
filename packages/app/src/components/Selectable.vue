<template>
  <div
    class="selectable"
    :class="{
      'selectable--selected': isSelected,
      'selectable--flash': flash
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Selectable',
  props: {
    /** Whether or not the item should show a flash once to the user. */
    flash: {
      type: Boolean,
      default: false
    },

    /** Whether or not the element is selected. */
    isSelected: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.selectable {
  outline: none;

  &--selected {
    filter: drop-shadow(0 0 6px var(--color-secondary));
  }

  &--flash {
    animation: flash 1s normal ease-out;
  }
}

@keyframes flash {
  0% {
    filter: inherit;
  }
  50% {
    filter: drop-shadow(0px 0px 20px var(--color-secondary));
  }
  100% {
    filter: inherit;
  }
}
</style>
