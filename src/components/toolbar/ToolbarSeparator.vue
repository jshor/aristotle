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
  border-left: 1px solid var(--color-secondary);
  box-sizing: border-box;
  margin: 0.25rem;
  box-shadow: 0 0 $border-width var(--color-shadow);
  width: 1px;
  height: 3em;
}
</style>
