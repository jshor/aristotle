<template>
  <div class="port-set">
    <div class="port-set__container port-set__container--left">
      <slot name="left" />
    </div>
    <div class="port-set__container port-set__container--top">
      <slot name="top" />
    </div>
    <div class="port-set__container port-set__container--right">
      <slot name="right" />
    </div>
    <div class="port-set__container port-set__container--bottom">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PortSet'
})
</script>

<style lang="scss">
.port-set {
  &__container {
    position: relative;
    display: flex;
    position: absolute;

    &--left, &--right {
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      width: 50%;
      flex-direction: column;
      justify-content: space-around;
    }

    &--right {
      left: 50%;
      align-items: flex-end;
    }

    &--bottom, &--top {
      flex: 1;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      height: 50%;
      justify-content: center;
      align-items: center;
      justify-content: space-around;
    }

    &--bottom {
      top: 50%;
      align-items: flex-end;
    }

    &--top {
      bottom: 50%;
      align-items: flex-start;
    }
  }
}
</style>
