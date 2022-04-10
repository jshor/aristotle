<template>
  <div
    class="selectable"
    :class="{
      'selectable--selected': isSelected
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
    filter: drop-shadow(3px 3px 2px rgba(0, 0, 0, .7));
  }
}
</style>
