<template>
  <div
    class="draggable"
    ref="draggable"
    :style="style"
    @mousedown.left="onMouseDown"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="dragEnd"
    @focus="onFocus"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import boundaries from '@/store/document/geometry/boundaries'
import Point from '@/types/interfaces/Point'
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  computed,
  ref,
  ComponentPublicInstance
} from 'vue'
import { TOUCH_HOLD_TIMEOUT } from '@/constants'

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
    touchhold: ($event: TouchEvent) => true
  },
  setup (props, { emit }) {
    const style = computed(() => ({
      left: `${props.position.x}px`,
      top: `${props.position.y}px`
    }))
    const draggable = ref<ComponentPublicInstance<HTMLElement>>()

    let requestAnimationFrameId = 0
    let touchTimeout = 0
    let isDragging = false // whether or not this element is being dragged
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

    // watchEffect(() => {
    //   if (props.isSelected) {
    //     // TODO: this sometimes causes an infinite loop, as this instance may compete
    //     // with other focused Draggable instances for the user's focus
    //     // draggable.value?.$el.focus()
    //   }
    // })

    /**
     * Focus event handler.
     *
     * @emits `select` if not already selected
     */
    function onFocus () {
      requestAnimationFrame(() => {
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
    function drag ($event: MouseEvent | Touch) {
      const { clientX, clientY } = $event

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

      const { x, y, width, height } = draggable.value.getBoundingClientRect()

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
      $event.stopPropagation()
      $event.preventDefault()

      emit('select', $event.ctrlKey)
      dragStart($event)
    }

    /**
     * Mouse movement event handler.
     *
     * @param {MouseEvent} $event - event that triggered the dragging operation
     */
    function onMouseMove ($event: MouseEvent) {
      if (!isDragging) return
      if (requestAnimationFrameId) return

      requestAnimationFrameId = window.requestAnimationFrame(() => {
        requestAnimationFrameId = 0

        $event.stopPropagation()
        $event.preventDefault()

        drag($event)
      })
    }

    /**
     * Touch event initialization handler.
     * Invoked when the element is first touched.
     *
     * @emits `touchold` when held down for more than 500ms
     * @param {TouchEvent} $event
     */
    function onTouchStart ($event: TouchEvent) {
      $event.stopPropagation()
      $event.preventDefault()

      hasMovedSubstantially = false
      initialTouchPosition = {
        x: $event.touches[0].clientX,
        y: $event.touches[0].clientY
      }

      touchTimeout = window.setTimeout(() => {
        emit('touchhold', $event)
      }, TOUCH_HOLD_TIMEOUT) // TODO: make 500 configurable?
    }

    /**
     * Invoked when the connection is moved by touching.
     *
     * @param {TouchEvent} $event
     */
    function onTouchMove ($event: TouchEvent) {
      $event.stopPropagation()
      $event.preventDefault()

      if (requestAnimationFrameId) return
      if ($event.touches.length > 1) {
        return onTouchEnd($event)
      }

      requestAnimationFrameId = window.requestAnimationFrame(() => {
        requestAnimationFrameId = 0

        if (!boundaries.isInNeighborhood(initialTouchPosition, {
          x: $event.touches[0].clientX,
          y: $event.touches[0].clientY
        }, 5)) {
          hasMovedSubstantially = true
          clearTimeout(touchTimeout)
        }

        if (!props.allowTouchDrag) return

        isDragging = true
        drag($event.touches[0])
      })
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
    function onTouchEnd ($event: TouchEvent) {
      clearTimeout(touchTimeout)

      $event.stopPropagation()
      $event.preventDefault()

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
