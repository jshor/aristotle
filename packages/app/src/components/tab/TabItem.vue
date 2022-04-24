<template>
  <div
    :class="{
      'tab-item--active': active,
      'tab-item--dirty': dirty
    }"
    class="tab-item"
    @mousedown="$emit('activate')"
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
  background-color: $color-bg-quaternary;
  border-style: solid;
  border-color: $color-bg-tertiary;
  border-width: $border-width $border-width $border-width 0;
  color: $color-primary;
  box-sizing: border-box;

  &:first-of-type {
    border-left: $border-width solid $color-bg-tertiary;
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
      color: $color-secondary;
    }

    &:active {
      color: $color-bg-quaternary;
    }
  }

  &--active {
    background-color: $color-bg-secondary;
    color: $color-primary;
    margin-bottom: -5px;
    padding-bottom: 15px;

    .tab-item__close::before {
      display: block;
    }
  }

  &--dirty {
    color: #E2C070; // TODO: brand-primary?
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
