<template>
  <div class="main-view">
    <div class="main-view__top">
      <slot name="top" />
    </div>
    <div class="main-view__middle">
      <slot name="middle" />
    </div>
    <div class="main-view__bottom">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'OscilloscopeViewer'
})
</script>

<style lang="scss">
.main-view {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &__middle {
    flex: 1;
    overflow: hidden;
  }
}
</style>
