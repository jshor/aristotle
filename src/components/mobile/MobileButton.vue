<template>
  <div class="mobile-button">
    <icon
      :icon="icon"
      class="mobile-button__icon"
    />
    <div class="mobile-button__label">{{ label }}</div>
    <icon
      v-if="chevron"
      :icon="faChevronDown"
      :class="{
        'mobile-button__icon--open': isOpen
      }"
      class="mobile-button__icon--chevron"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { faChevronDown, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import Icon from '../Icon.vue'

export default defineComponent({
  name: 'MobileButton',
  components: { Icon },
  props: {
    label: {
      type: String,
      default: ''
    },
    icon: {
      type: Object as PropType<any>, // TODO: fix this type
      required: true
    },
    chevron: {
      type: Boolean,
      default: false
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  setup () {
    return { faChevronDown }
  }
})
</script>

<style lang="scss">
.mobile-button {
  padding: 0.75em;
  display: flex;
  box-sizing: border-box;
  color: var(--color-primary);
  border: 1px solid var(--color-bg-secondary);
  border-width: 1px 0 1px;
  margin-top: -1px;

  &__label {
    flex: 1;
    margin-left: 0.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__icon {
    width: 0.75em;

    &--chevron {
      width: 0.5em;
      transition: transform 250ms;
    }

    &--open {
      transform: rotate(-180deg);
    }
  }
}
</style>
