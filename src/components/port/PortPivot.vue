<template>
  <div
    class="port-pivot"
    :style="{
      transform: `rotate(-${rotation * 90}deg)`
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PortPivot',
  props: {
    /** Rotation of the port container. */
    rotation: {
      type: Number,
      default: 0
    }
  }
})
</script>

<style lang="scss">
.port-pivot {
  width: 1px;
  height: 1px;
  position: relative;
  pointer-events: none;
}
</style>
