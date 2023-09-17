<template>
  <div
    class="draggable"
    :style="style"
    @mousedown.left="onLeftMouseDown"
    @mouseup="onMouseUp"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="dragEnd"
    @focus="onFocus"
    @contextmenu="$emit('contextmenu', $event)"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import Point from '@/types/interfaces/Point'
import { defineComponent, PropType, computed } from 'vue'
import { TOUCH_HOLD_TIMEOUT } from '@/constants'
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

    /**
     * Focus event handler.
     *
     * @emits `select` if not already selected
     */
    function onFocus () {
      if (!props.isSelected) {
        emit('select', true)
      }
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
        : emit('select', true)
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
      longTouchTimeout: TOUCH_HOLD_TIMEOUT,
      onTouched,
      onDragStart: (p: Point, o: Point) => emit('dragStart', p, o),
      onDrag: (p: Point, o: Point) => emit('drag', p, o),
      onDragEnd: (p: Point, o: Point) => emit('dragEnd', p, o)
    })

    return {
      style,
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
    outline: auto 5px -webkit-focus-ring-color;
  }
}
</style>
