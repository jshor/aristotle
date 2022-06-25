<template>
  <resizable
    class="draggable"
    ref="draggable"
    :style="style"
    @mousedown.left="onMouseDown"
    @mouseup="onMouseUp"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="dragEnd"
    @focus="onFocus"
  >
    <slot />
  </resizable>
</template>

<script lang="ts">
import boundaries from '@/store/document/geometry/boundaries'
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  computed,
  ref,
  ComponentPublicInstance,
  watchEffect
} from 'vue'
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
    touchhold: ($event: TouchEvent) => true
  },
  setup (props, { emit }) {
    const style = computed(() => ({
      left: `${props.position.x}px`,
      top: `${props.position.y}px`
    }))
    const draggable = ref<ComponentPublicInstance<HTMLElement>>()

    let touchTimeout = 0
    let isDragging = false // whether or not this element was dragged
    let hasMovedSubstantially = false
    let hasEmittedDragStart = false
    let initialTouchPosition: Point = { x: 0, y: 0 }
    let position: Point = { x: 0, y: 0 }
    let offset: Point = { x: 0, y: 0 } // distance from the click point to the draggable's center point

    onMounted(() => {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', dragEnd)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', dragEnd)
    })

    watchEffect(() => {
      if (props.isSelected) {
        draggable.value?.$el.focus()
      }
    })

    /**
     * Focus event handler.
     *
     * @emits `select` if not already selected
     */
    function onFocus () {
      setTimeout(() => {
        if (!props.isSelected) {
          emit('select', false)
        }
      })
    }

    /**
     * Drag event handler.
     *
     * @emits `dragStart` the first time the element is dragged, with position and pointer offset
     * @emits `drag` when the element is actively dragged, with position and pointer offset
     * @param {MouseEvent | Touch} $event - event that triggered the dragging operation
     */
    function drag ({ clientX, clientY }: MouseEvent | Touch) {
      if (!isDragging) return
      if (position.x === clientX && position.y === clientY) return

      position = {
        x: clientX,
        y: clientY
      }

      hasEmittedDragStart
        ? emit('drag', position, offset)
        : emit('dragStart', position, offset)

      hasEmittedDragStart = true
      hasMovedSubstantially = true
    }

    /**
     * Dragging initializer.
     *
     * @param {MouseEvent | Touch} $event - event that triggered the dragging operation
     */
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

      isDragging = true
      hasEmittedDragStart = false
    }

    /**
     * Dragging terminator.
     *
     * @emits `dragEnd` with the last dragged position and pointer offset
     */
    function dragEnd () {
      if (!isDragging) return

      isDragging = false

      if (hasMovedSubstantially) {
        emit('dragEnd', position, offset)
      }
    }

    /**
     * Mouse down event handler.
     *
     * @param {MouseEvent} $event - event that triggered the dragging operation
     */
    function onMouseDown ($event: MouseEvent) {
      dragStart($event)
    }

    /**
     * Mouse movement event handler.
     *
     * @param {MouseEvent} $event - event that triggered the dragging operation
     */
    function onMouseMove ($event: MouseEvent) {
      if (isDragging) {
        $event.stopImmediatePropagation()
        $event.preventDefault()

        drag($event)
      }
    }

    /**
     * Mouse up event handler.
     *
     * @param {MouseEvent} $event - event that triggered the dragging operation
     */
    function onMouseUp ($event: MouseEvent) {
      if (!hasEmittedDragStart) {
        // emit('select', $event.ctrlKey) // TODO
      }
    }

    /**
     * Touch event initialization handler.
     * Invoked when the element is first touched.
     *
     * @emits `touchold` when held down for more than 500ms
     * @param {TouchEvent} $event
     */
    function onTouchStart ($event: TouchEvent) {
      hasMovedSubstantially = false
      initialTouchPosition = {
        x: $event.touches[0].clientX,
        y: $event.touches[0].clientY
      }

      touchTimeout = window.setTimeout(() => {
        emit('touchhold', $event)
      }, 500) // TODO: make 500 configurable?
    }

    /**
     * Invoked when the connection is moved by touching.
     *
     * @param {TouchEvent} $event
     */
    function onTouchMove ($event: TouchEvent) {
      const newPosition: Point = {
        x: $event.touches[0].clientX,
        y: $event.touches[0].clientY
      }

      if (!boundaries.isInNeighborhood(initialTouchPosition, newPosition, 5) && $event.touches.length === 1) {
        hasMovedSubstantially = true
        clearTimeout(touchTimeout)
      }

      if (props.allowTouchDrag) {
        $event.stopPropagation()
        $event.preventDefault()

        if (!isDragging) {
          dragStart($event.touches[0])
        }
      }

      if (isDragging) {
        drag($event.touches[0])
      }
    }

    /**
     * Touch termination event handler.
     * Completes a dragging operation if in progress.
     * Changes the selection state otherwise.
     *
     * @emits `select` if the element is not selected
     * @emits `deselect` if the element is currently selected
     * @param {TouchEvent} $event
     */
    function onTouchEnd () {
      clearTimeout(touchTimeout)

      if (isDragging) {
        dragEnd()
      } else if (!hasMovedSubstantially) {
        props.isSelected
          ? emit('deselect')
          : emit('select', true)
      }
    }

    return {
      style,
      draggable,
      onMouseDown,
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
  outline: none;
}
</style>
