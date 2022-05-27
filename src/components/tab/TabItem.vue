<template>
  <div
    :class="{
      'tab-item--active': active,
      'tab-item--dirty': dirty
    }"
    class="tab-item"
    @mousedown="$emit('activate')"
    @touchstart="$emit('activate')"
  >
    <div class="tab-item__label">
      {{ label }}{{ dirty ? '*' : '' }}
    </div>
    <div
      class="tab-item__close"
      @click.stop="$emit('close')"
    >
      ✖
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TabItem',
  props: {
    /** Whether or not the tab is currently displayed as active. */
    active: {
      type: Boolean,
      default: false
    },
    /** The tab title. */
    label: {
      type: String,
      required: true
    },
    dirty: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.tab-item {
  display: flex;
  max-width: 200px;
  padding: 0.5rem;
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
  border-color: var(--color-bg-tertiary);
  border-style: solid;
  border-width: $border-width $border-width $border-width 0;
  border-bottom: 0;
  box-sizing: border-box;

  &:first-of-type {
    border-left: $border-width solid var(--color-bg-tertiary);
  }

  &__label, &__close {
    display: inline-block;
    justify-content: center;
    align-items: center;
  }

  &__label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__close {
    padding-left: 0.5rem;
    transition: all 0.1s;
    cursor: pointer;
    font-weight: bold;

    &:hover {
      color: var(--color-secondary);
    }

    &:active {
      color: var(--color-bg-secondary);
    }
  }

  &--active {
    background-color: var(--color-bg-primary);
    color: var(--color-primary);
    margin-bottom: -5px;
    padding-bottom: 15px;

    .tab-item__close::before {
      display: block;
    }
  }

  &:not(.tab--active) {
    cursor: pointer;
  }

  &:hover {
    .tab__close {
      &::before {
        display: block;
      }

      &::after {
        display: none;
      }
    }
  }
}
</style>
