<template>
  <div class="mobile-header">
    <div
      class="mobile-header__button"
        @click="$emit('open')"
    >
      <icon :icon="faBars" />
    </div>
    <div class="mobile-header__heading">
      <span
        class="mobile-header__document-name"
        @click="onSelect"
      >
        {{ documentName || $t('appName') }}
      </span>
      <span
        v-if="documentCount > 1"
        class="mobile-header__badge"
        @click="onSelect"
      >
        {{ documentCount }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { faBars } from '@fortawesome/free-solid-svg-icons'
import Icon from '../Icon.vue'

const props = withDefaults(defineProps<{
  documentName: string | null
  documentCount: number
}>(), {
  documentName: null,
  documentCount: 1
})

const emit = defineEmits<{
  /** User request to select an open document. */
  (e: 'select'): void
  /** User request to open the mobile pullout. */
  (e: 'open'): void
}>()

/**
 * Emits the `select` event if there is more than one document.
 */
function onSelect () {
  if (props.documentCount > 1) {
    emit('select')
  }
}
</script>

<style lang="scss">
.mobile-header {
  display: flex;
  background-color: var(--color-bg-primary);
  color: var(--color-primary);

  &__button {
    width: 1em;
    min-width: 1em;
    font-size: 1.5em;
    padding: 0.5em;
    display: flex;
    align-items: center;
  }

  &__heading {
    flex: 1;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 1em;
  }

  &__document-name {
    max-width: calc(100% - 2.5em); // 2.5em = badge width + its left margin
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    border-radius: 1.5em;
    background-color: var(--color-primary);
    color: var(--color-bg-primary);
    font-weight: bold;
    margin-left: 0.5em;
    padding: 0 0.5em;
  }
}
</style>
