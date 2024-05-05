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
    <div class="tab-item__icon">
      <icon :icon="faCodeBranch" />
    </div>
    <div class="tab-item__label">
      {{ label }}{{ dirty ? '*' : '' }}
    </div>
    <div
      class="tab-item__icon tab-item__icon--close"
      :title="$t('button.close')"
      @click.stop="$emit('close')"
      @touchstart.stop="$emit('close')"
      @mousedown.stop
    >
      <icon :icon="faClose" />
    </div>
  </div>
</template>

<script lang="ts">
import { faClose, faCodeBranch } from '@fortawesome/free-solid-svg-icons'
import { defineComponent } from 'vue'
import Icon from '../Icon.vue'

export default defineComponent({
  name: 'TabItem',
  components: { Icon },
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
  },
  setup () {
    return {
      faClose,
      faCodeBranch
    }
  }
})
</script>

<style lang="scss">
.tab-item {
  --padding: 0.5em;

  display: flex;
  max-width: 200px;
  padding: var(--padding);
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

  &__label, &__icon {
    display: inline-block;
    justify-content: center;
    align-items: center;
    padding: 0 calc(var(--padding) / 2);
  }

  &__label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__icon {
    display: flex;
    transition: all 0.1s;
    font-weight: bold;
    width: 0.75em;
    border-radius: 2px;

    &--close {
      cursor: pointer;

      &:hover, &:active {
        background-color: var(--color-bg-tertiary);
      }
    }
  }

  &--active {
    background-color: var(--color-bg-primary);
    color: var(--color-primary);
    margin-bottom: calc(var(--padding) * -1);
    padding-bottom: calc(var(--padding) * 2);
  }

  &:not(.tab-item--active) {
    .tab-item__icon--close {
      opacity: 0;
    }
  }

  &:hover {
    .tab-item__icon--close {
      opacity: 1;
    }
  }
}
</style>
