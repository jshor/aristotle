<template>
  <transition name="modal" appear>
    <div
      v-if="modelValue"
      class="modal"
    >
      <div class="modal__inner">
        <div class="modal__title">
          <div class="modal__title-text">
            {{ title }}
          </div>
          <button
            title="Close"
            @click="$emit('update:modelValue', false)"
            class="modal__close"
          >
            <icon :icon="faClose" />
          </button>
        </div>
        <div class="modal__content">
          <slot />
        </div>
        <div
          v-if="$slots['buttons']"
          class="modal__buttons">
          <slot name="buttons" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { faClose } from '@fortawesome/free-solid-svg-icons'
import { defineComponent, ref } from 'vue'
import Icon from '@/components/Icon.vue'

export default defineComponent({
  name: 'Modal',
  components: { Icon },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: ''
    }
  },
  setup () {
    const show = ref(false)

    return { faClose, show }
  }
})
</script>

<style lang="scss">
.modal {
  z-index: 9999;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  &__inner {
    width: 100%;
    height: 100%;
    max-width: 700px;
    background-color: var(--color-bg-primary);
    max-height: 600px;
    padding: 1em;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    filter: drop-shadow(0px 0px 3px black);
  }

  &__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
  }

  &__buttons {
    text-align: right;
  }

  &__title {
    display: flex;
  }

  &__title-text {
    flex: 1;
    font-size: 1.5em;
  }

  &__close {
    color: var(--color-primary);
    background-color: transparent;
    border: 0;
    border-radius: 2px;
    box-sizing: border-box;
    height: 2.5em;
    width: 2.5em;
    transition: 0.5;
    transition: color 0.1s;
    cursor: pointer;

    &:hover {
      color: var(--color-secondary);
    }

    &:active {
      color: var(--color-tertiary);
    }
  }

  &-enter-active {
    animation: blur-in 0.5s;
  }

  &-leave-active {
    animation: blur-in 0.5s reverse;
  }
}

@keyframes blur-in {
  from {
    opacity: 0;
    filter: blur(4px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
</style>
