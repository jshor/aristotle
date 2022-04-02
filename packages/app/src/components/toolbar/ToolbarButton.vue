<template>
  <button
    :tabindex="-1"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'ToolbarButton',
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>]
