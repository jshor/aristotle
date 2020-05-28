<template>
  <div
    class="port-handle"
    :class="{
      'port-handle--active': active
    }"
    @mousedown="mousedown"
    @mouseup="mouseup"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class Port extends Vue {
  @Prop({ default: false })
  /**
   * Sets the port handle to be visually active.
   *
   * @type {boolean}
   */
  public active: boolean

  /**
   * Wrapper for the `mousedown` event.
   *
   * @param {MouseEvent} event
   * @emits `mousedown`
   */
  public mousedown (event: MouseEvent) {
    this.$emit('mousedown', event)
  }

  /**
   * Wrapper for the `mouseup` event.
   *
   * @param {MouseEvent} event
   * @emits `mouseup`
   */
  public mouseup (event: MouseEvent) {
    this.$emit('mouseup', event)
  }
}
</script>

<style lang="scss">
.port-handle {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid black;
  box-sizing: border-box;
  top: -8px;
  left: -8px;
  width: 16px;
  height: 16px;
  background-color: red;
  border-radius: 50%;
  cursor: grab;
  transition: all 0.25s;
  z-index: 1001;

  &:active {
    cursor: grabbing;
  }

  &--active {
    width: 24px;
    height: 24px;
    top: -12px;
    left: -12px;
  }
}
</style>
