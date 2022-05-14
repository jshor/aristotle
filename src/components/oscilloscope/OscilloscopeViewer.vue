<template>
  <div class="oscilloscope-viewer">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'OscilloscopeViewer'
})
</script>

<style lang="scss">
.oscilloscope-viewer {
  height: calc(100% - 2.5em);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
