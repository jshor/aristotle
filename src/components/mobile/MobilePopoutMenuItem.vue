<template>
  <div class="mobile-popout-menu-item">
    <icon
      :icon="icon"
      class="mobile-popout-menu-item__icon"
    />
    <div class="mobile-popout-menu-item__label">{{ label }}</div>
    <icon
      v-if="closable"
      :icon="faClose"
      class="mobile-popout-menu-item__icon"
      @click="$emit('close')"
    />
  </div>
</template>

<script lang="ts">
import { faClose, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { defineComponent, PropType } from 'vue'
import Icon from '../Icon.vue'

export default defineComponent({
  components: { Icon },
  name: 'MobileFileName',
  emits: {
    close: () => true
  },
  props: {
    label: {
      type: String,
      required: true
    },
    icon: {
      type: Object as PropType<IconDefinition>,
      required: true
    },
    closable: {
      type: Boolean,
      default: true
    }
  },
  setup () {
    return { faClose }
  }
})
</script>

<style lang="scss">
.mobile-popout-menu-item {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--color-bg-secondary);
  color: var(--color-primary);
  padding: 0 0.75em;

  &__label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
    white-space: nowrap;
    padding: 0.75em;
  }

  &__icon {
    width: 1em;
    height: 1em;
  }
}
</style>
