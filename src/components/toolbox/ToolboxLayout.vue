<template>
  <div
    ref="toolbox"
    class="toolbox-layout"
    :class="{ 'toolbox-layout--open': isOpen }"
    :style="{ height: `${height}px` }"
  >
    <scroll-fade
      class="toolbox-layout__categories"
      :hide-scrollbar="true"
    >
      <div
        v-for="category in categories"
        class="toolbox-layout__badge"
        :class="{
          'toolbox-layout__badge--active': category === selected
        }"
        :key="category"
        @click="select(category)"
      >
        {{ $t(`toolbox.${category}`) }}
      </div>
    </scroll-fade>
    <scroll-fade class="toolbox-layout__items">
      <slot :name="selected" />
    </scroll-fade>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import ScrollFade from '@/components/layout/ScrollFade.vue'

export default defineComponent({
  name: 'Toolbox',
  components: {
    ScrollFade
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  setup (props, { slots }) {
    const selected = ref<string | null>(null)
    const toolbox = ref<HTMLElement | null>(null)
    const categories = computed(() => Object.keys(slots))
    const height = computed(() => props.isOpen ? toolbox.value?.scrollHeight : 0)

    function select (categoryName: string) {
      selected.value = categoryName
    }

    select(categories.value[0])

    return {
      categories,
      selected,
      select,
      height,
      toolbox
    }
  }
})
</script>

<style lang="scss">
.toolbox-layout {
  height: 0;
  opacity: 0;
  transition: all 0.25s ease-in-out;
  overflow-x: auto;
  background-color: var(--color-bg-primary);
  color: var(--color-primary);

  &--open {
    opacity: 1;
  }

  &__items {
    display: flex;
  }

  &__categories {
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }

  &__badge {
    padding: 0.25em 0.5em;
    margin: 0.5em;
    margin-bottom: 0;
    border-radius: 2px;
    box-sizing: border-box;
    white-space: nowrap;
    cursor: pointer;

    &:hover:not(.toolbox-layout__badge--active) {
      background-color: var(--color-bg-secondary);
    }

    &--active {
      background-color: var(--color-primary);
      color: var(--color-bg-primary);
      cursor: default;
    }
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
