<template>
  <button
    :tabindex="0"
    :class="{
      'toolbar-button--active': active && !isToolbox,
      'toolbar-button--toolbox': active && isToolbox,
      'toolbar-button--disabled': disabled
    }"
    class="toolbar-button"
    role="button"
    @click="onClick"
  >
    <icon v-if="icon" :icon="icon" class="toolbar-button__icon" />
    <icon v-else :icon="faUser" class="toolbar-button__icon" />
    <div class="toolbar-button__text">{{ text }}</div>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { faUser, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import Icon from '@/components/Icon.vue'

export default defineComponent({
  name: 'ToolbarButton',
  components: {
    Icon
  },
  data () {
    return { faUser }
  },
  emits: {
    click: ($event: MouseEvent) => true
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    isToolbox: {
      type: Boolean,
      default: false
    },
    icon: {
      type: Object as PropType<any>, // TODO: fix this type
      default: null
    },
    text: {
      type: String,
      default: ''
    }
  },
  setup (props, { emit }) {
    function onClick ($event: MouseEvent) {
      $event.stopPropagation()
      $event.preventDefault()

      if (!props.disabled) {
        emit('click', $event)
      }
    }

    return { onClick }
  }
})
</script>

<style lang="scss">
.toolbar-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25em;
  border-radius: 2px;
  border: 0;
  cursor: pointer;
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
  text-shadow: drop-shadow(0 0 1px var(--color-shadow));
  width: 4.5em;
  box-sizing: border-box;

  &--active {
    background: linear-gradient(0, var(--color-secondary), var(--color-primary));
    color: var(--color-bg-primary);
  }

  &--disabled {
    opacity: 0.25;
    cursor: default;
  }

  &__icon {
    width: 32px;
    height: 32px;
  }

  &__text {
    padding-top: 0.5em;
    font-size: 0.8rem;
    font-family: system-ui;
    text-align: center;
    box-sizing: border-box;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: block;
    max-width: 100%;
  }

  &--toolbox {
    background-color: var(--color-bg-primary);
    position: relative;

    &::after {
      position: absolute;
      left: 0;
      width: 100%;
      content: ' ';
      background-color: var(--color-bg-primary);
      display: block;
      height: 0.5em;
      bottom: -0.5em;
      z-index: 10;
    }
  }

  &:not(.toolbar-button--disabled):not(.toolbar-button--toolbox) {
    &:hover {
      background-color: var(--color-bg-quaternary);
    }

    &:active {
      background-color: var(--color-bg-tertiary);
    }
  }
}
</style>
