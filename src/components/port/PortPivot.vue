<template>
  <resizable
    class="port-pivot"
    :style="{
      transform: `rotate(-${rotation * 90}deg)`
    }"
    @keydown.space="$emit('connect')"
  >
    <slot />
  </resizable>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Resizable from '@/components/interactive/Resizable.vue'

export default defineComponent({
  name: 'PortPivot',
  components: { Resizable },
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
