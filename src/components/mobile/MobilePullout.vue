<template>
  <transition name="mobile-pullout">
    <div
      v-if="modelValue"
      class="mobile-pullout"
    >
      <div
        class="mobile-pullout__overlay"
        @click="$emit('update:modelValue', false)"
      />
      <div class="mobile-pullout__content">
        <slot />
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MobilePullout',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  }
})
</script>

<style lang="scss">
.mobile-pullout {
  z-index: 10000;
  bottom: 0;
  right: 0;

  &, &__content, &__overlay {
    position: absolute;
    top: 0;
    left: 0;
  }

  &__overlay {
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
  }

  &__content {
    display: block;
    max-width: 300px;
    width: 100%;
    height: 100vh;
    background-color: var(--color-bg-primary);
    overflow-y: auto;
    // animation: 500ms slide forwards;
  }


  &-enter-active {
    &, .mobile-pullout__content {
      transition: all 0.3s ease-out;
    }
  }

  &-leave-active {
    &, .mobile-pullout__content {
      transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
    }
  }

  &-enter-from, &-leave-to {
    .mobile-pullout__content {
      transform: translateX(-100%);
    }

    opacity: 0;
  }
}
</style>
