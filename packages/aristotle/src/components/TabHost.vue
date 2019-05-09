<template>
  <div class="tab-host">
    <div class="tab-host__tabs">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TabHost'
}
</script>

<style lang="scss">
.tab-host {
  position: relative;
  background-color: $color-bg-secondary;
  max-height: 100%;

  &::after {
    height: $scrollbar-width;
    content: '';
    display: block;
    background-color: $color-bg-secondary;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 1;
    transition: all 0.5s;
    pointer-events: none;
    border-style: solid;
    border-color: $color-bg-tertiary;
    border-width: 0 $border-width 0 $border-width;
  }

  &:hover {
    &::after {
      opacity: 0;
    }
  }

  &__tabs {
    display: flex;
    align-items: flex-end;
    padding-bottom: $scrollbar-width;
    box-sizing: border-box;
    overflow-x: overlay;
    text-shadow: $border-width 0 0 $color-shadow;
    height: 100%;

    &::after {
      flex: 1;
      border-top: $border-width solid $color-bg-primary;
      border-bottom: $border-width solid $color-bg-quaternary;
      background-color: $color-bg-primary;
      padding: 0.5rem 0;
      content: '\00a0';
    }

    &::-webkit-scrollbar
    {
      background-color: $color-bg-secondary;
      height: $scrollbar-width;
      z-index: -1;
    }

    &::-webkit-scrollbar-thumb {
      background-color: $color-secondary;
      transition: all 1s;
    }
  }
}
</style>
