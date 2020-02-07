<template>
  <div
    class="overlay"
    :class="{
      'overlay--dark': dark
      }"
    @click="$emit('click')"
    @contextmenu="$emit('contextmenu')">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'Overlay',
  props: {
    dark: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 1000;

  &--dark {
    background-color: rgba(0, 0, 0, 0.5);
  }
}
</style>
