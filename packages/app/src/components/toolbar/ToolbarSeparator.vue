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
