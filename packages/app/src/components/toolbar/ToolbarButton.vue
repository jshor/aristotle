<template>
  <button
    :tabindex="0"
    :disabled="disabled"
    :class="{
      'toolbar-button--active': active
    }"
    class="toolbar-button"
    role="button"
  >
    <icon v-if="icon" :icon="icon" class="toolbar-button__icon" />
    <icon v-else :icon="faUser" class="toolbar-button__icon" />
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
  props: {
    active: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    icon: {
      type: Object as PropType<IconDefinition>,
      default: null
    }
  }
})
</script>

<style lang="scss">
.toolbar-button {
  display: flex;
  color: $color-primary;
  padding: 0.25rem 0;
  width: 2em;
  height: 2em;
  font-size: 1.25rem;
  border-radius: 2px;
  text-shadow: drop-shadow(0 0 1px $color-shadow);
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  border: 0;
  background: none;
  outline: none;
  cursor: pointer;

  &__icon {
    height: 90%;
    width: 90%;
  }

  &--active {
    background: linear-gradient(0, $color-secondary, $color-primary);
    color: $color-bg-secondary;
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }

  &:not(:disabled) {
    &:hover {
      background-color: $color-bg-quaternary;
    }

    &:active {
      background-color: $color-bg-tertiary;
    }
  }
}
</style>
