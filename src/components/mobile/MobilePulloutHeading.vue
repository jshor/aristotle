<template>
  <div class="mobile-pullout-heading">
    <img
      src="/public/logo.svg"
      class="mobile-pullout-heading__logo"
    />
    <div class="mobile-pullout-heading__brand">
      <div class="mobile-pullout-heading__title">
        Aristotle
      </div>
      <div class="mobile-pullout-heading__subtitle">
         v{{ version }}
      </div>
    </div>
    <icon
      :icon="faClose"
      class="mobile-pullout-heading__close"
      @click="$emit('close')"
    />
  </div>
</template>

<script lang="ts">
import { faClose } from '@fortawesome/free-solid-svg-icons'
import { defineComponent } from 'vue'
import Icon from '../Icon.vue'

export default defineComponent({
  name: 'MobilePulloutHeading',
  components: { Icon },
  props: {
    version: {
      type: String,
      default: '1.0.0'
    }
  },
  emits: {
    close: () => true
  },
  setup () {
    return { faClose }
  }
})
</script>

<style lang="scss">
.mobile-pullout-heading {
  display: flex;
  padding: 0.5em;
  color: var(--color-primary);

  &__logo {
    width: 2em;
  }

  &__brand {
    display: flex;
    justify-content: center;
    flex-direction: column;
    flex: 1;
    padding: 0 0.5em;
    box-sizing: border-box;
  }

  &__title {
    font-size: 1.25em;
  }

  &__subtitle {
    font-size: 0.75em;
    padding-top: 0.25em;
    color: var(--color-secondary);
  }

  &__close {
    width: 1em;
    padding-right: 0.5em;
  }
}
</style>
