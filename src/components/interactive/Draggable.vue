<template>
  <div
    class="draggable"
    :style="style"
    :tabindex="isFocusable ? 0 : -1"
    @mousedown.left="onLeftMouseDown"
    @mouseup="onMouseUp"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="dragEnd"
    @focus="onFocus"
    @contextmenu="$emit('contextmenu', $event)"
  >
    <div
      v-if="hasHiddenFocus"
      :tabindex="0"
      @blur="hasHiddenFocus = false"
      ref="focusRef"
    />
    <slot />
  </div>
</template>

<script lang="ts">
import Point from '@/types/interfaces/Point'
import { defineComponent, PropType, computed, ref, nextTick } from 'vue'
import { TOUCH_LONG_HOLD_TIMEOUT } from '@/constants'
import { useDraggable } from '@/composables/useDraggable'

export default defineComponent({
  name: 'Draggable',
  props: {
    /** Whether or not this connection is selected. */
    position: {
      type: Object as PropType<Point>,
      default: () => ({ x: 0, y: 0 })
    },

    /** Whether or not this connection is selected. */
    isSelected: {
      type: Boolean,
      default: false
    },

    /** Whether or not this element can have focus. */
    isFocusable: {
      type: Boolean,
      default: false
    },

    /** Set to true if the element can be dragged by touch events. */
    allowTouchDrag: {
      type: Boolean,
      default: true
    }
  },
  emits: {
    dragStart: (position: Point, offset: Point) => true,
    drag: (position: Point, offset: Point) => true,
    dragEnd: (position: Point, offset: Point) => true,
    select: (deselectAll?: boolean) => true,
    deselect: () => true,
    touchhold: ($event: TouchEvent) => true,
    contextmenu: ($event: MouseEvent) => true
  },
  setup (props, { emit }) {
    const style = computed(() => ({
      left: `${props.position.x}px`,
      top: `${props.position.y}px`
    }))
    const focusRef = ref<HTMLElement>()
    const hasHiddenFocus = ref(false)

    /**
     * Focus event handler.
     *
     * @emits `select` if not already selected
     */
    function onFocus () {
      emit('select', true)
    }

    /**
     * Touch termination event handler.
     */
    function onTouched ($event: TouchEvent, held: boolean) {
      if (held) {
        return emit('touchhold', $event)
      }

      props.isSelected
        ? emit('deselect')
        : emit('select')

      applyHiddenFocus()
    }

    /**
     * Handles the left mouse down event.
     * This will select the item if it is not already selected.
     * The draggable `mousedown` event will continue to be propagated.
     */
    function onLeftMouseDown ($event: MouseEvent) {
      onMouseDown($event)

      if (!props.isSelected) {
        emit('select', !$event.ctrlKey)
      }

      applyHiddenFocus()
    }

    /**
     * Places focus within this component (but hidden from the user).
     *
     * This is so that the draggable element can have focus and the tab index order
     * be maintained, but not have the outline appear when this element is clicked on.
     */
    async function applyHiddenFocus () {
      if (!props.isFocusable) return

      hasHiddenFocus.value = true

      await nextTick()

      if (props.isSelected) {
        focusRef.value?.focus()
      } else {
        hasHiddenFocus.value = false
      }
    }

    const allowTouchDrag = computed(() => props.allowTouchDrag)
    const {
      onMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      dragEnd,
    } = useDraggable({
      allowTouchDrag,
      longTouchTimeout: TOUCH_LONG_HOLD_TIMEOUT,
      onTouched,
      onDragStart: (p: Point, o: Point) => emit('dragStart', p, o),
      onDrag: (p: Point, o: Point) => emit('drag', p, o),
      onDragEnd: (p: Point, o: Point) => emit('dragEnd', p, o)
    })

    return {
      style,
      focusRef,
      hasHiddenFocus,
      onLeftMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      dragEnd,
      onFocus
    }
  }
})
</script>

<style lang="scss">
.draggable {
  position: absolute;
  pointer-events: none;
  touch-action: none;

  &:focus {
    outline: auto $outline-border-width -webkit-focus-ring-color;
  }
}
</style>
