<template>
  <viewport-container :position="position">
    <div class="context-menu">
      <div
        v-for="(item, key) in items"
        :key="key"
        @click="click(item)"
        class="context-menu__container">
        <div
          v-if="item.type === 'separator'"
          class="context-menu__separator"
        />
        <div
          v-else
          class="context-menu__item"
          :class="{ 'context-menu__item--disabled': !item.enabled }">
          <div class="context-menu__label">{{ item.label }}</div>
          <div class="context-menu__shortcut">{{ shortcuts[key] }}</div>
        </div>
      </div>
    </div>
  </viewport-container>
</template>

<script>
import ContextMenu from './ContextMenu'
import ViewportContainer from './ViewportContainer'

export default {
  name: 'ContextMenu',
  components: {
    ContextMenu,
    ViewportContainer
  },
  props: {
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    items: {
      type: Array,
      default: []
    }
  },
  computed: {
    shortcuts () {
      function toShortcut (hotkey) {
        if (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
          return `⌘${hotkey}`
        }
        return `Ctrl+${hotkey}`
      }

      return this
        .items
        .map((item) => item.hotkey ? toShortcut(item.hotkey) : '')
    }
  },
  methods: {
    click (item) {
      if (item.enabled) {
        this.$emit('action', item.action)
      }
      event.stopPropagation()
    }
  }
}
</script>

<style lang="scss">
.context-menu {
  width: 150px;
  border: 1px solid $color-bg-quaternary;
  z-index: 10000;
  background-color: $color-bg-secondary;
  border-radius: 1px;
  flex: 1;
  box-sizing: border-box;

  &__container {
    position: relative;

    &:hover > .context-menu__submenu {
      display: block;
    }
  }

  &__separator {
    background-color: $color-bg-quaternary;
    height: 1px;
    width: 95%;
    margin: 0.25rem auto;
  }

  &__item {
    display: flex;
    flex-direction: row;
    padding: 0.35rem;
    color: $color-primary;

    &--disabled {
      color: $color-secondary;
    }

    &:hover {
      background-color: $color-bg-quaternary;
    }
  }

  &__label, &__shortcut {
    flex: 1;
  }

  &__shortcut {
    text-align: right;
  }
}
</style>
