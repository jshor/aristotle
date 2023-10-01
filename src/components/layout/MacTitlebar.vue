<template>
  <div class="mac-titlebar">
    {{ title }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MacTitlebar',
  props: {
    title: {
      type: String,
      default: ''
    }
  }
})
</script>

<style lang="scss">
.mac-titlebar {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  height: 1.75rem;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  user-select: none;
}
</style>
