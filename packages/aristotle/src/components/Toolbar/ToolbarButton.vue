<template>
  <button
    :disabled="disabled"
    :class="{
      'toolbar-button--active': active
    }"
    @click="$emit('click')"
    class="toolbar-button">
    <i :class="`fas fa-${icon}`" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({
  name: 'ToolbarButton',
  props: {
    icon: {
      type: String,
      default: 'ban'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    }
  }
})
export default class ToolbarButton extends Vue {
}
</script>

<style lang="scss">
.toolbar-button {
  display: flex;
  color: $color-primary;
  padding: 0.25rem 0;
  width: 1.85rem;
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

  &--active {
    background: linear-gradient(0, $color-secondary, $color-primary);
    color: $color-bg-secondary;
  }

  &:disabled {
    opacity: 0.25;
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
