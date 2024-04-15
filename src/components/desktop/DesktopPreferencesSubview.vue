<template>
  <section class="desktop-preferences-subview">
    <slot />
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
}>()
</script>

<style lang="scss">
.desktop-preferences-subview {
  flex: 0.7;
  padding: 1em;
  background-color: var(--color-bg-secondary);
}
</style>
