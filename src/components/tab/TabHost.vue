<template>
  <div class="tab-host">
    <div class="tab-host__list">
      <slot name="tabs" />
    </div>
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TabHost'
})
</script>

<style lang="scss">
.tab-host {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  margin-left: -1px;

  &__list {
    display: flex;
    border-bottom: 1px solid var(--color-bg-quaternary);
  }
}
</style>
