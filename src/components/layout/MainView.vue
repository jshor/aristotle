<template>
  <div
    class="main-view"
    :class="{
      'main-view--blurred': isBlurred
    }"
  >
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
  name: 'MainView',
  props: {
    isBlurred: {
      type: Boolean,
      default: false
    }
  }
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

  &--blurred {
    filter: blur(4px);
  }
}
</style>
