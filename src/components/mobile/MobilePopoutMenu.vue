<template>
  <transition name="mobile-popout-menu">
    <div
      v-if="modelValue"
      class="mobile-popout-menu"
    >
      <div
        class="mobile-popout-menu__overlay"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="mobile-popout-menu__content">
          <slot />
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MobilePopoutMenu',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  }
})
</script>

<style lang="scss">
.mobile-popout-menu {
  z-index: 10000;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &, &__wrapper, &__overlay {
    position: absolute;
    top: 0;
    left: 0;
  }

  &__overlay, &__wrapper {
    width: 100vw;
    height: 100vh;
  }

  &__overlay {
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__content {
    width: 100%;
    max-width: 300px;
    max-height: 100vh;
    background-color: var(--color-bg-primary);
    overflow-y: auto;

    transform: scale(1);
  }

  &-enter-active {
    &, .mobile-popout-menu__content {
      transition: all 0.3s ease-out;
    }
  }

  &-leave-active {
    &, .mobile-popout-menu__content {
      transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
    }
  }

  &-enter-from, &-leave-to {
    .mobile-popout-menu__content {
      transform: scale(0);
    }

    opacity: 0;
  }
}
</style>
