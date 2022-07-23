<template>
  <resizable
    @mousewheel="onMouseWheel"
    @mousedown.right="onMouseDown"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @resize="rect => $emit('resize', rect)"
    class="editor"
  >
    <div
      :style="style"
      class="editor__grid"
    >
      <selector
        :zoom="zoom"
        @selection-start="onSelectionStart"
        @selection-end="onSelectionEnd"
        ref="selector"
      />
      <slot />
    </div>
  </resizable>
</template>

<script lang="ts">
import {
  ComponentPublicInstance,
  defineComponent,
  PropType,
  StyleValue,
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  watch
} from 'vue'
import Selector from './Selector.vue'
import Resizable from '../interactive/Resizable.vue'
import boundaries from '@/store/document/geometry/boundaries'

/**
 * The editor canvas component, including the viewable container parent.
 *
 *  - It is where all BaseItems live.
 *
 *  - Its functionality includes panning (using the right mouse button or one-finger touch drag)
 *    and zooming (via two-finger pinch or shift key + mouse wheel), and global de-selection.
 *
 *  - It holds the responsibility of gatekeeping the `contextmenu` event emission.
 *
 *  - The canvas part of this is huge and its size is computed by the document store, while the
 *    viewable area ("viewport") is much smaller and expands to the parent element containing it.
 *    This will emit `resize` and `pan` events to inform the parent component (Document.vue) of
 *    the viewport's current dimensions and the position of the canvas w.r.t. the viewport.
 */
export default defineComponent({
  name: 'Editor',
  emits: {
    resize: (rect: DOMRect) => true,
    pan: (point: Point, animate?: boolean) => true,
    selection: (boundingBox: BoundingBox) => true,
    deselect: () => true,
    zoom: (payload: { zoom: number, point?: Point }) => true,
    contextmenu: ($event: MouseEvent) => true
  },
  components: {
    Selector,
    Resizable
  },
  props: {
    /** Current document zoom level. */
    zoom: {
      type: Number,
      default: 1
    },

    /** Grid size. */
    gridSize: {
      type: Number,
      default: 0
    },

    /** Total width of the canvas. */
    width: {
      type: Number,
      default: 0
    },

    /** Total height of the canvas. */
    height: {
      type: Number,
      default: 0
    },

    /** The Cartesian offset of the editor, w.r.t. the viewer. */
    offset: {
      type: Object as PropType<Point>,
      default: () => ({ x: 0, y: 0 })
    },

    /** Whether or not the panning change should be animated. */
    animatePan: {
      type: Boolean,
      default: false
    }
  },
  setup (props, { emit }) {
    let panStartPosition: Point = {
      x: 0,
      y: 0
    }
    let previousPosition: Point = {
      x: 0,
      y: 0
    }
    let originalMousePosition: Point = {
      y: 0,
      x: 0
    }
    let speed = 0
    let angle = 0
    let isPanning = false
    let firstPinchDistance = 0
    let initialZoom = 1

    const selector = ref<ComponentPublicInstance<HTMLElement> | null>(null)
    const style = computed((): StyleValue => ({
      backgroundSize: `${props.gridSize}px ${props.gridSize}px`,
      transform: `scale(${props.zoom})`,
      left: `${props.offset.x}px`,
      top: `${props.offset.y}px`,
      width: `${props.width}px`,
      height: `${props.height}px`,
    }))

    onMounted(() => {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })

    /**
     * Computes the distance between the first two fingers of a touch event.
     *
     * @param {TouchEvent} $event
     * @returns {number}
     */
    function getTouchDistance ({ touches }: TouchEvent) {
      const deltaX = touches[0].clientX - touches[1].clientX
      const deltaY = touches[0].clientY - touches[1].clientY

      return Math.hypot(deltaX, deltaY)
    }

    /**
     * Begins panning the canvas.
     *
     * @param {number} x - x position of the mouse pointer or finger
     * @param {number} y - y position of the mouse pointer or finger
     */
    function startPanning (x: number, y: number) {
      isPanning = true
      panStartPosition = {
        x: x - props.offset.x,
        y: y - props.offset.y
      }
      originalMousePosition = { x, y }
      previousPosition = { x, y }
      speed = 0
      angle = 0
    }

    /**
     * Handles the moving of the canvas, if in panning mode.
     *
     * @param {number} x - x position of the mouse pointer or finger
     * @param {number} y - y position of the mouse pointer or finger
     */
    function pan (x: number, y: number) {
      if (isPanning) {
        const deltaX = previousPosition.x - x
        const deltaY = previousPosition.y - y

        emit('pan', {
          x: Math.min(x - panStartPosition.x, 0),
          y: Math.min(y - panStartPosition.y, 0)
        })

        speed = Math.hypot(deltaX, deltaY)
        angle = Math.atan2(deltaY, deltaX)
        previousPosition = { x, y }
      }
    }

    /**
     * Ends panning. This will ease panning out by the computed speed in `pan()`.
     */
    function endPanning () {
      const friction = 1.5 // TODO: const?
      const x = speed * Math.cos(angle) * friction
      const y = speed * Math.sin(angle) * friction

      emit('pan', {
        x: Math.min(props.offset.x - x, 0),
        y: Math.min(props.offset.y - y, 0)
      }, true)
    }

    /**
     * Mouse down event handler. This will begin panning.
     *
     * @param {MouseEvent} $event
     */
    function onMouseDown ($event: MouseEvent) {
      startPanning($event.x, $event.y)

      $event.preventDefault()
      $event.stopPropagation()
    }

    /**
     * Mouse move event handler.
     *
     * @emits `pan`
     * @param {MouseEvent} $event
     */
    function onMouseMove ($event: MouseEvent) {
      pan($event.x, $event.y)
    }

    /**
     * Terminates panning mode, if panning. This will suppress the context menu if so.
     *
     * @emits `contextmenu` when the mouse has not moved substantially
     * @param {MouseEvent} $event
     */
    function onMouseUp ($event: MouseEvent) {
      if (!isPanning) return

      isPanning = false

      if ($event.button === 2) {
        if (boundaries.isInNeighborhood($event, originalMousePosition, 5)) {
          // if the mouse moved less than 2 pixels in any direction, show the context menu
          emit('contextmenu', $event)

          return
        }
      }

      endPanning()
    }

    /**
     * Touch start event handler.
     *
     * If multiple fingers are present, this will begin pinch-to-zoom.
     * If only one finger is present, this will begin panning.
     *
     * @param {TouchEvent} $event
     */
    function onTouchStart ($event: TouchEvent) {
      const { clientX, clientY } = $event.touches[0]

      if ($event.targetTouches.length > 1) {
        firstPinchDistance = getTouchDistance($event)
        initialZoom = props.zoom
      } else {
        startPanning(clientX, clientY)
      }

      $event.preventDefault()
      $event.stopPropagation()
    }

    /**
     * Touch movement event handler.
     *
     * @emits `zoom` when two fingers pinch the screen
     * @emits `pan` when one finger moves around the screen
     * @param {TouchEvent} $event
     */
    function onTouchMove ($event: TouchEvent) {
      const { clientX, clientY } = $event.touches[0]

      $event.preventDefault()
      $event.stopPropagation()

      if ($event.targetTouches.length > 1 && $event.changedTouches.length > 1) {
        const distance = getTouchDistance($event)
        const zoom = Math.max(Math.min(initialZoom * (distance / firstPinchDistance), 4), 0.1)
        const point = {
          x: (clientX + $event.touches[1].clientX) / 2,
          y: (clientY + $event.touches[1].clientY) / 2
        }

        emit('zoom', { zoom, point })
      } else if(firstPinchDistance === 0) {
        pan(clientX, clientY)
      }
    }

    /**
     * Touch completion event handler.
     *
     * @emits `deselect` when the finger has not moved substantially (more than 5 pixels)
     * @param {TouchEvent} $event
     */
    function onTouchEnd ($event: TouchEvent) {
      if ($event.target === selector.value?.$el) {
        emit('deselect')
      }

      if (isPanning) {
        endPanning()
      }

      isPanning = false
      firstPinchDistance = 0
    }

    /**
     * Zooms the editor if the shift key is held down while scrolling with a mouse wheel.
     *
     * @emits `zoom`
     * @param {WheelEvent} $event
     */
    function onMouseWheel ($event: WheelEvent) {
      const { deltaY, x, y, shiftKey } = $event

      if (!shiftKey) return

      // normalize mouse wheel movement to +1 or -1 to avoid unusual jumps
      const wheel = deltaY < 0 ? 1 : -1
      const zoom = props.zoom + (wheel / 10)

      emit('zoom', { zoom, point: { x, y } })
    }

    /**
     * Deselects all elements if the shift key is not held down when the editor is clicked.
     *
     * @emits `deselect` when the shift key is not held down
     * @param {MouseEvent} $event
     */
    function onSelectionStart ($event: MouseEvent) {
      if (!$event.shiftKey) {
        emit('deselect')
      }
    }

    /**
     * Ends the drag selection.
     *
     * @emits `selection`
     * @param {BoundingBox} boundary
     */
    function onSelectionEnd (boundary: BoundingBox) {
      emit('selection', boundary)
    }

    return {
      selector,
      style,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseWheel,
      onSelectionStart,
      onSelectionEnd
    }
  }
})
</script>

<style lang="scss">
.editor {
  overflow: hidden;

  &__grid {
    position: relative;
    box-sizing: border-box;
    transform-origin: top left;
    background-color: var(--color-bg-primary);
    background-image:
      linear-gradient(to right, var(--color-bg-secondary) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-bg-secondary) 1px, transparent 1px);
  }
}
</style>
