<template>
  <div class="item-shell">
    <div class="item-shell__ports--left">
      <slot name="left" />
    </div>
    <div class="item-shell__ports--top">
      <slot name="top" />
    </div>
    <div class="item-shell__ports--right">
      <slot name="right" />
    </div>
    <div class="item-shell__ports--bottom">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ItemShell'
}
</script>

<style lang="scss">
.item-shell {
  display: flex;
  align-items: center;
  position: absolute;
  width: 100%;
  height: 100%;

  &__ports {
    position: relative;
    display: flex;
    align-items: center;

    &--left, &--right {
      top: 0;
      bottom: 0;
      width: 1px;
    }

    &--left {
      left: 0;
      right: 100%;
      justify-content: flex-start;
    }

    &--right {
      right: 0;
      left: 100%;
      justify-content: flex-end;
    }

    &--bottom, &--top {
      flex: 1;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      height: 1px;
      justify-content: center;
    }

    &--bottom {
      top: 100%;
      align-items: flex-end;
    }

    &--top {
      top: 0;
      align-items: flex-start;
    }
  }
}
</style>
