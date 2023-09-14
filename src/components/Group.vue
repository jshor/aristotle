<template>
  <div
    class="group"
    aria-roledescription="group"
    :class="{
      'group--is-selected': isSelected
    }"
    :tabindex="-1"
    :style="{
      position: 'absolute',
      left: `${boundingBox.left}px`,
      top: `${boundingBox.top}px`,
      width: `${boundingBox.right - boundingBox.left}px`,
      height: `${boundingBox.bottom - boundingBox.top}px`,
      zIndex
    }"
  />
</template>

<script lang="ts">
import BoundingBox from '@/types/types/BoundingBox';
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'Group',
  props: {
    boundingBox: {
      type: Object as PropType<BoundingBox>,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    zIndex: {
      type: Number,
      default: 0
    },
    zoom: {
      type: Number,
      default: 1
    }
  }
})
</script>

<style lang="scss">
.group {
  border: 2px dashed transparent;
  box-sizing: border-box;
  position: absolute;
  pointer-events: none;
  width: 100%;
  height: 100%;

  &--is-selected {
    display: block;
    border-color: var(--color-secondary);
    cursor: move;
  }
}
</style>
