<template>
  <resizable
    class="draggable"
    ref="draggable"
    :style="style"
    @mousedown.stop="onMouseDown"
    @mouseup="onMouseUp"
    @touchstart.stop="onTouchStart"
    @touchmove.stop="onTouchMove"
    @touchend.stop="dragEnd"
    @touchcancel="dragEnd"
    @focus="onFocus"
  >
    <slot />
  </resizable>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, PropType, computed, ref, ComponentPublicInstance, watchEffect } from 'vue'
import Resizable from './Resizable.vue'

export default defineComponent({
  name: 'Draggable',
  components: {
    Resizable
  },
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

    /** Whether or not the device is a mobile device. */
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'dragStart',
    'drag',
    'dragEnd',
    'select',
    'deselect',
    'touchhold'
  ],
  setup (props, { emit }) {
    const style = computed(() => ({
      left: `${props.position.x}px`,
      top: `${props.position.y}px`
    }))
    const draggable = ref<ComponentPublicInstance<HTMLElement>>()

    onMounted(() => {
      window.addEventListener('mousemove', drag)
      window.addEventListener('mouseup', dragEnd)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', drag)
      window.removeEventListener('mouseup', dragEnd)
    })

    watchEffect(() => {
      if (props.isSelected) {
        draggable.value?.$el.focus()
      }
    })

    let touchTimeout = 0
    let isDragging = false
    let hasEmittedDragStart = false
    let position = { x: 0, y: 0 }
    let offset = { x: 0, y: 0 } // distance from the click point to the draggable's center point

    /**
     * Selects the connection (if not selected), or de-selects it otherwise.
     *
     * @param keepCurrentSelection - if true, maintains the selection state of other items in the editor
     */
    function toggleSelection (keepCurrentSelection: boolean) {
      props.isSelected
        ? emit('deselect')
        : emit('select', keepCurrentSelection)
    }

    function drag ({ clientX, clientY }: MouseEvent | Touch) {
      if (!isDragging) return
      if (position.x === clientX && position.y === clientY) return

      position = {
        x: clientX,
        y: clientY
      }

      emit(hasEmittedDragStart ? 'drag' : 'dragStart', position, offset)

      hasEmittedDragStart = true
    }

    function dragStart ({ clientX, clientY }: MouseEvent | Touch) {
      if (!draggable.value) return

      const { x, y, width, height } = draggable.value.$el.getBoundingClientRect()

      position = {
        x: clientX,
        y: clientY
      }

      offset = {
        x: clientX - (x + width / 2),
        y: clientY - (y + height / 2)
      }

      hasEmittedDragStart = false
    }

    function dragEnd () {
      if (!isDragging) return

      clearTimeout(touchTimeout)
      emit('dragEnd', position, offset)

      isDragging = false
    }

    /**
     * Mouse down event handler.
     */
    function onMouseDown ($event: MouseEvent) {
      isDragging = true

      dragStart($event)
    }

    function onMouseUp ($event: MouseEvent) {
      if (!hasEmittedDragStart) {
        emit('select', $event.ctrlKey)
      }
    }

    /**
     * Invoked when the connection is first touched.
     */
    function onTouchStart ($event: TouchEvent) {
      touchTimeout = window.setTimeout(() => {
        isDragging = false
        toggleSelection(true)
        navigator.vibrate(100) // TODO: make 100 configurable?
        emit('touchhold', $event)
      }, 1000) // TODO: make 500 configurable?

      dragStart($event.touches[0])
      isDragging = true
    }

    /**
     * Invoked when the connection is moved by touching.
     */
    function onTouchMove ($event: TouchEvent) {
      clearTimeout(touchTimeout)
      drag($event.touches[0])
    }

    /**
     * Focus event handler.
     */
    function onFocus () {
      setTimeout(() => {
        if (!props.isSelected) {
          emit('select', false)
        }
      })
    }

    return {
      style,
      draggable,
      onMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchMove,
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
}
</style>
