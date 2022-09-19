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
        @click="$emit('select')"
      >
        {{ documentName }}
      </span>
      <span
        v-if="documentCount > 1"
        class="mobile-header__badge"
        @click="$emit('select')"
      >
        {{ documentCount }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { faPlusSquare } from '@fortawesome/free-regular-svg-icons'
import Icon from '../Icon.vue'

export default defineComponent({
  components: { Icon },
  name: 'MobileHeader',
  emits: {
    select: () => true,
    open: () => true
  },
  props: {
    documentName: {
      type: String,
      required: true
    },
    documentCount: {
      type: Number,
      default: 1
    }
  },
  setup () {
    return {
      faBars,
      faPlusSquare
    }
  }
})
</script>

<style lang="scss">
.mobile-header {
  display: flex;
  background-color: var(--color-bg-primary);
  color: var(--color-primary);

  &__button {
    width: 1em;
    min-width: 1em;
    font-size: 1.25em;
    padding: 0.25em;
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
    width: 2em;
    border-radius: 1.5em;
    background-color: var(--color-primary);
    color: var(--color-bg-primary);
    font-size: 0.5em;
    padding: 0.5em;
    font-weight: bold;
    margin-left: 1em;
  }
}
</style>
