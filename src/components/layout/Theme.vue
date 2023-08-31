<template>
  <div
    class="theme"
    :class="{
      'theme--dark': dark
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Theme',
  props: {
    dark: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.theme {
  --color-bg-primary: #{$color-light-bg-primary};
  --color-bg-secondary: #{$color-light-bg-secondary};
  --color-bg-tertiary: #{$color-light-bg-tertiary};
  --color-bg-quaternary: #{$color-light-bg-quaternary};

  // foreground colors
  --color-primary: #{$color-light-primary};
  --color-secondary: #{$color-light-secondary};
  --color-shadow: #{$color-light-shadow};

  // chalk colors
  --saturation: 40%;
  --lightness: 50%;

  &--dark {
    --color-bg-primary: #{$color-dark-bg-primary};
    --color-bg-secondary: #{$color-dark-bg-secondary};
    --color-bg-tertiary: #{$color-dark-bg-tertiary};
    --color-bg-quaternary: #{$color-dark-bg-quaternary};

    // foreground colors
    --color-primary: #{$color-dark-primary};
    --color-secondary: #{$color-dark-secondary};
    --color-shadow: #{$color-dark-shadow};

    // chalk colors
    --saturation: 70%;
    --lightness: 70%;
  }

  background-color: var(--color-bg-primary);
  color: var(--color-bg-secondary);
}
</style>
