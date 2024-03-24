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
      ref="grid"
    >
      <!-- when tabbed into, this resets the selection back to the last focusable element in the editor -->
      <div
        :tabindex="0"
        data-test="first"
        @focus="recycleFocus(false)"
      />

      <!-- editor content (items, connections, groups, ports, etc.) -->
      <slot />

      <!-- when tabbed into, this resets the selection back to the first focusable element in the editor -->
      <div
        :tabindex="0"
        data-test="last"
        @focus="recycleFocus(true)"
      />
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
  ref
} from 'vue'
import Resizable from '../interactive/Resizable.vue'
import boundaries from '@/store/document/geometry/boundaries'
import { MIN_ZOOM, MAX_ZOOM, PANNING_FRICTION } from '@/constants'
import BoundingBox from '@/types/types/BoundingBox'
import Point from '@/types/interfaces/Point'

/**
 * The editor canvas component, including the viewable container parent.
 *
 *  - It is where all BaseItems live.
 *
 *  - Its functionality includes panning (using the right mouse button or finger touch drag)
 *    and zooming (via two-finger pinch or shift key + mouse wheel).
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
    /** When the canvas has resized. */
    resize: (rect: DOMRect) => true,
    /** When the canvas has panned. */
    pan: (delta: Point, animate?: boolean) => true,
    /** When the zoom of the canvas has changed. */
    zoom: (payload: { zoom: number, point?: Point }) => true,
    /** When the user has requested a context menu. */
    contextmenu: ($event: MouseEvent) => true
  },
  components: {
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

    /** The Cartesian offset of the editor, w.r.t. the viewer. */
    canvas: {
      type: Object as PropType<BoundingBox>,
      required: true
    },

    snapshot: {
      type: Object as PropType<BoundingBox>,
      default: null
    }
  },
  setup (props, { emit }) {
    let requestAnimationFrameId = 0
    let previousPosition: Point = {
      x: 0,
      y: 0
    }
    let originalMousePosition: Point = {
      y: 0,
      x: 0
    }
    let distanceTravelled = 0
    let angle = 0
    let isPanning = false
    let firstPinchDistance = 0
    let initialZoom = 1

    const selector = ref<ComponentPublicInstance<HTMLElement> | null>(null)
    const style = computed((): StyleValue => {
      const width = props.canvas.right - props.canvas.left
      const height = props.canvas.bottom - props.canvas.top

      return {
        backgroundSize: `${props.gridSize}px ${props.gridSize}px`,
        transform: `scale(${props.zoom})`,
        left: `${props.canvas.left}px`,
        top: `${props.canvas.top}px`,
        width: `${width}px`,
        height: `${height}px`
      }
    })
    const grid = ref<HTMLElement>()

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
     */
    function getTouchDistance ({ touches }: TouchEvent) {
      const deltaX = touches[0].clientX - touches[1].clientX
      const deltaY = touches[0].clientY - touches[1].clientY

      return Math.hypot(deltaX, deltaY)
    }

    /**
     * Returns the center point of a touch event.
     */
    function getTouchCenter ($event: TouchEvent) {
      if ($event.touches.length === 1) {
        return {
          x: $event.touches[0].clientX,
          y: $event.touches[0].clientY
        }
      } else {
        const cx = Math.abs($event.touches[0].clientX - $event.touches[1].clientX) / 2
        const cy = Math.abs($event.touches[0].clientY - $event.touches[1].clientY) / 2

        return {
          x: Math.min($event.touches[0].clientX, $event.touches[1].clientX) + cx,
          y: Math.min($event.touches[0].clientY, $event.touches[1].clientY) + cy
        }
      }
    }

    /**
     * Begins panning the canvas.
     */
    function startPanning (position: Point) {
      isPanning = true
      originalMousePosition = position
      previousPosition = position
      distanceTravelled = 0
      angle = 0
    }

    /**
     * Pans the canvas by the given delta amount.
     */
    function onPan ({ x, y }: Point) {
      requestAnimationFrameId = 0

      if (!isPanning) return

      const deltaX = x - previousPosition.x
      const deltaY = y - previousPosition.y

      emit('pan', {
        x: deltaX,
        y: deltaY
      })

      distanceTravelled = Math.hypot(deltaX, deltaY)
      angle = Math.atan2(deltaY, deltaX)
      previousPosition = { x, y }

      setTimeout(() => {
        distanceTravelled = 0
      }, 250) // TODO: make this number a constant - this is the snapshot time to compute velocity
    }

    /**
     * Handles panning when a touch move event occurs.
     */
    function onTouchPan ($event: TouchEvent) {
      requestAnimationFrameId = 0

      const point = getTouchCenter($event)

      if ($event.touches.length === 2 && firstPinchDistance) {
        const distance = getTouchDistance($event)

        // zoom must be within range of [MIN_ZOOM, MAX_ZOOM]
        const zoom = Math.max(
          Math.min(initialZoom * (distance / firstPinchDistance), MAX_ZOOM),
        MIN_ZOOM)

        emit('zoom', { zoom, point })
      }

      onPan(point)
    }

    /**
     * Ends panning. This will ease panning out by the distance travelled during `onPan()`.
     */
    function endPanning () {
      if (!distanceTravelled) return // don't use momentum if not moving

      const x = distanceTravelled * Math.cos(angle) * PANNING_FRICTION
      const y = distanceTravelled * Math.sin(angle) * PANNING_FRICTION

      emit('pan', { x, y }, true)
    }

    /**
     * Mouse down event handler. This will begin panning.
     */
    function onMouseDown ($event: MouseEvent) {
      startPanning($event)

      $event.preventDefault()
      $event.stopPropagation()
    }

    /**
     * Mouse move event handler.
     */
    function onMouseMove ($event: MouseEvent) {
      if (requestAnimationFrameId) return
      requestAnimationFrameId = window.requestAnimationFrame(() => onPan({
        x: $event.clientX,
        y: $event.clientY
      }))
    }

    /**
     * Terminates panning mode, if panning. This will suppress the context menu if so.
     */
    function onMouseUp ($event: MouseEvent) {
      if (!isPanning) return

      isPanning = false

      if ($event.button === 2) { // right click
        if (boundaries.isInNeighborhood($event, originalMousePosition, 5)) {
          // if the mouse moved less than 2 pixels in any direction, show the context menu
          emit('contextmenu', $event)
          return
        }
      }

      $event.stopPropagation()
      $event.preventDefault()

      endPanning()
    }

    /**
     * Touch start event handler.
     *
     * If multiple fingers are present, this will begin pinch-to-zoom.
     * If only one finger is present, this will begin panning.
     */
    function onTouchStart ($event: TouchEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      if ($event.touches.length > 2) return

      isPanning = false
      firstPinchDistance = 0
      initialZoom = props.zoom

      requestAnimationFrame(() => startPanning(getTouchCenter($event)))

      if ($event.touches.length === 2) {
        firstPinchDistance = getTouchDistance($event)
      }
    }

    /**
     * Touch movement event handler.
     */
    function onTouchMove ($event: TouchEvent) {
      if (requestAnimationFrameId) return
      requestAnimationFrameId = window.requestAnimationFrame(() => onTouchPan($event))
    }

    /**
     * Touch completion event handler.
     */
    function onTouchEnd ($event: TouchEvent) {
      if ($event.touches.length) {
        requestAnimationFrameId = window.requestAnimationFrame(() => onTouchStart($event))
        return
      }

      if (firstPinchDistance === 0) {
        // if panning using a single finger, provide momentum at the end
        endPanning()
      }

      isPanning = false
      firstPinchDistance = 0
      requestAnimationFrameId = 0
    }

    /**
     * Zooms the editor if the shift key is held down while scrolling with a mouse wheel.
     */
    function onMouseWheel ($event: WheelEvent) {
      if (!$event.ctrlKey || !$event.deltaY) return

      const wheel = $event.deltaY < 0 ? 1 : -1
      const zoom = props.zoom + (wheel / 10)

      emit('zoom', {
        zoom,
        point: {
          x: $event.x,
          y: $event.y
        }
      })
    }

    function recycleFocus (isLast = false) {
      const elements = grid.value?.querySelectorAll('[tabindex="0"]')

      if (elements) {
        const index = isLast
          ? 1 // first element is invisible
          : elements.length - 2 // length of elements list (-1 for invisible last element)
        const el = elements[index] as HTMLElement

        el?.focus()
      }
    }

    return {
      selector,
      style,
      grid,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseWheel,
      recycleFocus
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
