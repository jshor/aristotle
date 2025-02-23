<template>
  <div class="oscilloscope-message">
    {{ $t('oscilloscope.defaultMessage') }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'OscilloscopeMessage'
})
</script>

<style lang="scss">
.oscilloscope-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--color-secondary);
}
</style>
