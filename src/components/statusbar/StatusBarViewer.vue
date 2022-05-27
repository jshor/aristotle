<template>
  <div class="status-bar-viewer">
    <div class="status-bar-viewer__left">
      <slot name="left" />
    </div>
    <div class="status-bar-viewer__right">
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'StatusBarViewer'
})
</script>

<style lang="scss">
.status-bar-viewer {
  display: flex;
  height: 2em;
  align-items: center;
  background-color: var(--color-bg-secondary);
  color: var(--color-secondary);
  box-shadow: 0 0 $border-width var(--color-shadow);
  box-sizing: border-box;
  font-size: 0.85em;

  &__left, &__right, &__label {
    display: flex;
    align-items: center;
    height: 100%;
  }

  &__left {
    padding: 0 0.5em;
    flex: 1;
  }

  &__right {
    justify-content: flex-end;
    flex: 1;
  }

  &__label {
    text-align: center;
  }
}
</style>
