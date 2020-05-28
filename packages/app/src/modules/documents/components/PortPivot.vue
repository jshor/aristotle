<template>
  <div
    class="port-pivot"
    :style="{
      transform: `rotate(-${rotation * 90}deg)`
    }">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class PortPivot extends Vue {
  @Prop({ default: 0 })
  /**
   * Rotation of the port container.
   *
   * @type {boolean}
   */
  public rotation: number
}
</script>

<style lang="scss">
.port-pivot {
  width: 0;
  height: 0;
  position: relative;
}
</style>
