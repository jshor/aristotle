
import boundaries from '@/store/document/geometry/boundaries'
import Point from '@/types/interfaces/Point'
import { ComputedRef, onBeforeUnmount, onMounted } from 'vue'

export const useDraggable = (options: {
  allowTouchDrag: ComputedRef<boolean>
  longTouchTimeout: number
  onDragStart?: (position: Point, offset: Point) => void
  onDrag?: (position: Point, offset: Point) => void
  onDragEnd?: (position: Point, offset: Point) => void
  onSelect?: (deselectAll?: boolean, isTouchEvent?: boolean) => void
  onDeselect?: () => void
  onTouched?: ($event: TouchEvent, held: boolean) => void
}) => {
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
      ? options.onDrag?.(position, offset)
      : options.onDragStart?.(position, offset)

    hasEmittedDragStart = true
    hasMovedSubstantially = true
  }

  /**
   * Dragging initializer.
   *
   * @param {MouseEvent | Touch} $event - event that triggered the dragging operation
   */
  function dragStart ({ clientX, clientY }: MouseEvent | Touch, target: HTMLElement) {
    const { x, y, width, height } = target.getBoundingClientRect()

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
      options.onDragEnd?.(position, offset)
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

    options.onSelect?.($event.ctrlKey)
    dragStart($event, $event.target as HTMLElement)
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

  function onMouseUp ($event: MouseEvent) {
    dragEnd()
  }

  /**
   * Touch event initialization handler.
   * Invoked when the element is first touched.
   *
   * @emits `touchold` when held down for more than 500ms
   * @param {TouchEvent} $event
   */
  function onTouchStart ($event: TouchEvent) {
    dragStart($event.touches[0], $event.target as HTMLElement)

    hasMovedSubstantially = false
    isDragging = false
    initialTouchPosition = {
      x: $event.touches[0].clientX,
      y: $event.touches[0].clientY
    }

    touchTimeout = window.setTimeout(() => {
      options.onTouched?.($event, true)
    }, options.longTouchTimeout)
  }

  /**
   * Invoked when the connection is moved by touching.
   *
   * @param {TouchEvent} $event
   */
  function onTouchMove ($event: TouchEvent) {
    if (isDragging && hasMovedSubstantially) {
      $event.stopPropagation()
      $event.preventDefault()
    }

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

      if (!options.allowTouchDrag.value) return

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
      options.onTouched?.($event, false)
    }
  }

  return {
    onMouseDown,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseUp,
    dragEnd
  }
}
