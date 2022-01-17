<template>
  <div
    class="bounding-box"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`
    }"
  />
</template>


<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    }
  }
})
</script>

<style>
.bounding-box {
  position: absolute;
  border: 1px dashed red;
  pointer-events: none;
}
</style>
