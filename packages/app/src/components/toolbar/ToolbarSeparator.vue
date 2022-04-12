<template>
  <div class="toolbar-separator" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ToolbarSeparator'
})
</script>

<style lang="scss">

$color-bg-primary: #1D1E25;
$color-bg-secondary: #333641;
$color-bg-tertiary: #3D404B;
$color-bg-quaternary: #454857;

// foreground colors
$color-primary: #fff;
$color-secondary: #9ca0b1;
$color-shadow: #000;
$border-width: 1px;

.toolbar-separator {
  display: block;
  border-left: 1px solid $color-secondary;
  box-sizing: border-box;
  height: 80%;
  margin: 0 0.25rem;
  box-shadow: 0 0 $border-width $color-shadow;
  width: 1px;
}
</style>
