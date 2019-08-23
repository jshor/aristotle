<template>
  <div class="toolbox">
    <div class="toolbox__border">
      <div class="toolbox__pane">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Toolbox'
}
</script>

<style lang="scss">
.toolbox {
  padding: 0.5rem 0 0.5rem 0.5rem;
  height: 100%;
  box-sizing: border-box;

  &__border {
    box-shadow: 0 0 $border-width $color-shadow;
    box-sizing: border-box;
    height: 100%;
    border: $border-width solid $color-bg-tertiary;
    background-color: $color-bg-secondary;
    padding: 2px;
  }

  &__pane {
    height: 100%;
    background-color: $color-bg-primary;
    overflow: auto;
  }
}
</style>
