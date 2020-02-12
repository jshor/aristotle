<template>
  <div class="toolbar">
    <div class="toolbar__group toolbar__group--left">
      <slot name="left" />
    </div>

    <div class="toolbar__group toolbar__group--right">
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class Toolbar extends Vue {
}
</script>

<style lang="scss">
.toolbar {
  background-color: $color-bg-secondary;
  border: $border-width solid $color-bg-secondary;
  box-shadow: 0 0 $border-width $color-shadow;
  padding: 0.25rem;
  display: flex;

  &__group {
    flex: 1;
    display: flex;
    align-items: center;

    &--right {
      justify-content: flex-end;
    }
  }
}
</style>
