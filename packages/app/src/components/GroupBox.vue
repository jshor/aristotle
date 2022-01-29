<template>
  <div
    :class="{
      'group-box--is-selected': isSelected
    }"
    class="group-box"
  />
</template>

<script type="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GroupBox',
  props: {
    isSelected: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.group-box {
  border: 2px dashed #808080;
  box-sizing: border-box;
  position: absolute;
  pointer-events: none;
  width: 100%;
  height: 100%;

  &--is-selected {
    display: block;
    border-color: #000;
    cursor: move;
  }
}
</style>
