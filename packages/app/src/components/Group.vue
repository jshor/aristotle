<template>
  <draggable
    :tabindex="-1"
    :position="{
      x: boundingBox.left,
      y: boundingBox.top
    }"
    :style="{
      width: `${boundingBox.right - boundingBox.left}px`,
      height: `${boundingBox.bottom - boundingBox.top}px`,
      zIndex
    }"
    :zoom="zoom"
    :bounding-box="boundingBox"
  >
    <div
      :class="{
        'group--is-selected': isSelected
      }"
      class="group"
    />
  </draggable>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Draggable from './Draggable.vue'

export default defineComponent({
  name: 'Group',
  components: {
    Draggable
  },
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
    border-color: $color-secondary;
    cursor: move;
  }
}
</style>
