<template>

  <div class="mobile-collapsible-panel">
    <mobile-button
      :label="title"
      :icon="icon"
      :is-open="isOpen"
      @click="toggle"
      chevron
    />
    <div
      class="mobile-collapsible-panel__content"
      :style="{ height }"
    >
      <div ref="content">
        <div
          class="mobile-collapsible-panel__inner"
          :class="{
            'mobile-collapsible-panel__inner--open': isOpen
          }"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, PropType } from 'vue'
import { faChevronDown, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import MobileButton from './MobileButton.vue'

export default defineComponent({
  name: 'MobileCollapsiblePanel',
  components: { MobileButton },
  props: {
    title: {
      type: String,
      default: ''
    },
    icon: {
      type: Object as PropType<IconDefinition>,
      required: true
    }
  },
  setup () {
    const height = ref('0')
    const content = ref<HTMLElement>()
    const isOpen = ref(false)

    function applyState () {
      height.value = isOpen.value
        ? content.value?.clientHeight + 'px'
        : '0px'
    }

    function toggle () {
      isOpen.value = !isOpen.value
      applyState()
    }

    onMounted(() => applyState())

    return {
      faChevronDown,
      isOpen,
      height,
      content,
      toggle
    }
  }
})
</script>

<style lang="scss">
.mobile-collapsible-panel {
  display: flex;
  flex-direction: column;

  &__trigger {
    padding: 0.5em;
    display: flex;
    box-sizing: border-box;
    border-bottom: 1px solid var(--color-bg-secondary);
  }

  &__label {
    flex: 1;
  }

  &__icon {
    width: 0.5em;
    transition: transform 250ms;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__content {
    overflow: hidden;
    transition: height 0.3s;
    padding: 0;
    margin: 0;
  }

  &__inner {
    margin: 0;
    padding: 0;
    opacity: 0;
    transition: opacity 0.3s;

    &--open {
      opacity: 1;
    }
  }
}
</style>
