<template>
  <div
    @mousedown.left.self="onMouseDown"
    class="selector"
    ref="selector"
  >
    <div
      v-if="hasSelection"
      :style="style"
      class="selector__selection"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  StyleValue,
  computed,
  onMounted,
  onBeforeUnmount,
  ref
} from 'vue'

/**
 * The selection boundary component.
 *
 * This is the interactive boundary that the user creates when dragging the mouse on the editor
 * by holding down the left mouse button and dragging across the editor.
 *
 * All BaseItems that lie within this boundary would be selected once the mouse is released.
 */
export default defineComponent({
  name: 'Selector',
  emits: {
    selectionStart: ($event: MouseEvent) => true,
    selectionEnd: (boundingBox: BoundingBox) => true
  },
  props: {
    /** Current document zoom level. */
    zoom: {
      type: Number,
      default: 1
    }
  },
  setup (props, { emit }) {
    const start = ref<Point>({ x: 0, y: 0 })
    const end = ref<Point>({ x: 0, y: 0 })
    const selector = ref<HTMLElement | null>(null)
    const hasSelection = ref(false)
    const getBoundingBox = () => ({
      left: Math.min(start.value.x, end.value.x),
      top: Math.min(start.value.y, end.value.y),
      width: Math.abs(start.value.x - end.value.x),
      height: Math.abs(start.value.y - end.value.y)
    })

    const style = computed((): StyleValue => {
      const bbox = getBoundingBox()

      return {
        left: `${bbox.left}px`,
        top: `${bbox.top}px`,
        width: `${bbox.width}px`,
        height: `${bbox.height}px`,
      }
    })

    onMounted(() => {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })

    /**
     * Returns the screen position of the given mouse event.
     *
     * @param {MouseEvent} $event
     * @returns {Point}
     */
    function getPosition ($event: MouseEvent): Point {
      if (!selector.value) {
        return { x: 0, y: 0 }
      }

      const { top, left } = selector.value.getBoundingClientRect()
      const x = ($event.x - left) / props.zoom
      const y = ($event.y - top) / props.zoom

      return { x, y }
    }

    /**
     * Computes the final selection boundary.
     *
     * @emits `selectionEnd` with the {@link BoundingBox}
     */
    function createSelection () {
      const { left, top, width, height } = getBoundingBox()

      emit('selectionEnd', {
        left,
        top,
        bottom: height + top,
        right: left + width
      })
    }

    /**
     * Mouse down event handler. This initializes the selection.
     *
     * @emits `selectionStart`
     * @param {MouseEvent} $event
     */
    function onMouseDown ($event: MouseEvent) {
      const position = getPosition($event)

      hasSelection.value = true
      start.value = position
      end.value = position

      emit('selectionStart', $event)
    }

    /**
     * Mouse movement event handler. This resizes the selection boundary.
     *
     * @param {MouseEvent} $event
     */
    function onMouseMove ($event: MouseEvent) {
      if (hasSelection.value) {
        end.value = getPosition($event)
      }
    }

    /**
     * Mouse button release handler. This computes the final selection boundary.
     *
     * @param {MouseEvent} $event
     */
    function onMouseUp () {
      if (hasSelection.value) {
        createSelection()

        hasSelection.value = false
        start.value.x = 0
        start.value.y = 0
        end.value.x = 0
        end.value.y = 0
      }
    }

    return {
      selector,
      hasSelection,
      style,
      onMouseDown
    }
  }
})
</script>

<style lang="scss">
.selector {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.selector__selection {
  position: relative;
  border: 1px dashed #808080;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
