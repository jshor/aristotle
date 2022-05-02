<template>
  <div
    class="lightbulb"
    :class="{
      'lightbulb--on': value === 1,
      'lightbulb--high-z': value === 0
    }"
  />
</template>

<script type="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Lightbulb',
  props: {
    value: {
      type: Number,
      default: 0
    }
  }
})
</script>

<style lang="scss">
.lightbulb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid $color-secondary;
  background-color: rgba(67, 67, 67, 0.5);
  cursor: move;
  pointer-events: all;

  &--on {
    background-color: green;
    box-shadow: 0 0 20px green;
  }

  &--high-z {
    background-color: darkred;
  }
}
</style>
