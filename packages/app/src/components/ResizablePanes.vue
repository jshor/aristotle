<template>
  <div
    class="resizable-panes"
    :class="{
      'resizable-panes--vertical': isVertical
    }"
    ref="root"
  >
    <div
      class="resizable-panes__first"
      :class="{
        'resizable-panes__first--vertical': isVertical
      }"
      :style="firstStyle"
    >
      <div class="resizable-panes__content">
        <slot name="first" />
      </div>
      <div
        class="resizable-panes__divider"
        :class="{
          'resizable-panes__divider--vertical': isVertical
        }"
        @mousedown="mousedown"
      />
    </div>
    <div
      class="resizable-panes__second"
      :style="secondStyle"
    >
      <slot name="second" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ResizablePanes',
  data () {
    return {
      isMouseDown: false
    }
  },
  props: {
    isVertical: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Number,
      default: 30
    }
  },
  computed: {
    firstStyle () {
      const value = `${this.modelValue}%`

      if (this.isVertical) {
        return {
          height: value,
          maxHeight: value
        }
      }

      return {
        width: value,
        maxWidth: value
      }
    },
    secondStyle () {
      const value = `${100 - this.modelValue}%`

      if (this.isVertical) {
        return {
          height: value,
          maxHeight: value
        }
      }

      return {
        width: value,
        maxWidth: value
      }
    }
  },
  mounted () {
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  },
  methods: {
    mousedown () {
      this.isMouseDown = true
    },
    mouseup () {
      this.isMouseDown = false
    },
    mousemove ($event: MouseEvent) {
      if (!this.isMouseDown) return

      const position = this.isVertical ? $event.y : $event.x
      const rect = (this.$refs.root as HTMLElement).getBoundingClientRect()
      const offset = this.isVertical ? rect.y : rect.x
      const total = this.isVertical ? rect.height : rect.width
      const modelValue = Math.max(Math.min((((position - offset) / total) * 100), 100), 0)

      this.$emit('update:modelValue', modelValue)
    }
  }
})
</script>

<style lang="scss">
$divider-width: 20px;
$color-bg-primary: #1D1E25;
$color-bg-secondary: #333641;
$color-bg-tertiary: #3D404B;
$color-bg-quaternary: #454857;

// foreground colors
$color-primary: #fff;
$color-secondary: #9ca0b1;
$color-shadow: #000;

.resizable-panes {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  flex: 1;
  display: flex;
  background-color: $color-bg-primary;
  color: $color-secondary;

  &--vertical {
    flex-direction: column;
  }

  &__first {
    display: flex;
    border-right: 1px solid $color-bg-quaternary;

    &--vertical {
      flex-direction: column;
      border: 0;
      border-bottom: 1px solid $color-bg-quaternary;
    }
  }

  &__second {
    flex: 1;
    overflow: hidden;
  }

  &__content {
    flex: 1;
    max-height: 100%;
  }

  &__divider {
    display: block;
    margin-right: -$divider-width / 4;
    width: $divider-width / 2;
    height: 100%;
    background: #fff;
    opacity: 0;
    transition: opacity cubic-bezier(0, 0.52, 0.25, 1) 1s;
    z-index: 9999;
    cursor: ew-resize;

    &:hover {
      opacity: 1;
    }

    &--vertical {
      margin-right: 0;
      margin-bottom: -$divider-width / 2;
      width: 100%;
      height: $divider-width;
      cursor: ns-resize;
    }
  }
}
</style>
