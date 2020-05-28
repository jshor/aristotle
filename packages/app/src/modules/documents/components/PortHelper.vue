<template>
  <div
    class="port-helper snappable"
    :class="`port-helper--${orientation}`"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class PortHelper extends Vue {
  @Prop({ default: 'horizontal' })
  /**
   * Sets the visual orientation for the port snap helper.
   *
   * @type {string}
   */
  public orientation: string
}
</script>

<style lang="scss">
.port-helper {
  content: ' ';
  display: block;
  position: absolute;
  background-color: red;

  &--vertical {
    width: 1px;
    left: -1px;
    top: -200vh;
    height: 400vh;
  }

  &--horizontal {
    height: 1px;
    left: -200vh;
    width: 400vh;
  }
}
</style>
