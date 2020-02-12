<template>
  <div class="toolbar-separator" />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class ToolbarSeparator extends Vue {
}
</script>

<style lang="scss">
.toolbar-separator {
  display: block;
  border-left: 1px solid $color-secondary;
  box-sizing: border-box;
  height: 90%;
  margin: 0.25rem;
  box-shadow: 0 0 $border-width $color-shadow;
  width: 1px;
}
</style>
