<template>
  <svg
    class="wire"
    :class="{
      'wire--selected': isSelected,
      'wire--preview': isPreview,
      'wire--flash': flash
    }"
    :width="geometry.width"
    :height="geometry.height"
    aria-roledescription="connection"
  >
    <title>{{ label }}</title>
    <path
      class="wire__outline"
      fill="none"
      :transform="`translate(${Math.abs(geometry.minX)}, ${Math.abs(geometry.minY)})`"
      :d="geometry.path"
    />
    <path
      class="wire__display"
      :class="{
        'wire__display--on': sourceValue === LogicValue.TRUE,
        'wire__display--off': sourceValue === LogicValue.FALSE
      }"
      fill="none"
      :transform="`translate(${Math.abs(geometry.minX)}, ${Math.abs(geometry.minY)})`"
      :d="geometry.path"
    />
    <path
      v-if="isAnimated"
      class="wire__animation"
      :class="{
        'wire__animation--on': sourceValue === LogicValue.TRUE,
        'wire__animation--off': sourceValue === LogicValue.FALSE
      }"
      fill="none"
      :transform="`translate(${Math.abs(geometry.minX)}, ${Math.abs(geometry.minY)})`"
      :d="geometry.path"
    />
    <path
      class="wire__clickable"
      :class="{
        'wire__clickable--mobile': isMobile
      }"
      data-test="wire-clickable"
      fill="none"
      ref="wireRef"
      :transform="`translate(${Math.abs(geometry.minX)}, ${Math.abs(geometry.minY)})`"
      :d="geometry.path"
      @mousedown.left="onLeftMouseDown"
      @mouseup="onMouseUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchDrag"
      @touchend="onTouchEnd"
      @touchcancel="dragEnd"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import LogicValue from '@/types/enums/LogicValue'
import WireGeometry from '@/types/types/WireGeometry'
import Point from '@/types/interfaces/Point'
import isMobile from '@/utils/isMobile'
import { TOUCH_SHORT_HOLD_TIMEOUT } from '@/constants'

const props = defineProps<{
    /** The wire Bezier curve geometry. */
  geometry: WireGeometry
    /** Whether or not to display marching ants to indicate electrical flow direction. */
  isAnimated: boolean
    /** The logical value of the source port. */
  sourceValue: LogicValue
  /** The user-friendly label. */
  label: string
  /** Whether or not this connection is a preview (i.e., opaque in appearance). */
  isPreview?: boolean
  /** Whether or not this wire should display as selected (i.e., with a select shadow). */
  isSelected: boolean
  /** Whether or not the item should show a flash once to the user. */
  flash: boolean

}>()

const emit = defineEmits<{
  (e: 'add', point: Point, offset: Point): void
  (e: 'move', point: Point, offset: Point): void
  (e: 'added'): void
  (e: 'select', deselectAll?: boolean): void
  (e: 'deselect'): void
}>()

const wireRef = ref<SVGPathElement>()
const isTouchDragging = ref(false)
const allowTouchDrag = computed(() => isTouchDragging.value)

/**
 * Touch termination event handler.
 */
function onTouched ($event: TouchEvent, held: boolean) {
  if (held) {
    isTouchDragging.value = true

    return emit('add', {
      x: $event.touches[0].clientX,
      y: $event.touches[0].clientY
    }, { x: 0, y: 0 })
  }

  props.isSelected
    ? emit('deselect')
    : emit('select', false)
}

/**
 * Drag start event handler.
 */
function onDragStart (position: Point, offset: Point) {
  if (!isTouchDragging.value) {
    emit('add', position, offset)
  }
}

/**
 * Drag handler.
 */
function onDrag (position: Point, offset: Point) {
  emit('move', position, offset)
}

/**
 * Terminates the dragging operation.
 */
function onDragEnd () {
  isTouchDragging.value = false
  emit('added')
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

/**
 * Handles touch dragging.
 */
function onTouchDrag ($event: TouchEvent) {
  if (isTouchDragging.value) {
    $event.stopPropagation()
  }

  onTouchMove($event)
}


const {
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  dragEnd,
} = useDraggable({
  allowTouchDrag,
  longTouchTimeout: TOUCH_SHORT_HOLD_TIMEOUT,
  onTouched,
  onDragStart,
  onDrag,
  onDragEnd
})
</script>

<style lang="scss">
.wire {
  @include circuit-element;

  pointer-events: none;
  touch-action: none;
  position: absolute;

  &--preview {
    opacity: 0.5;
  }

  &__clickable {
    animation: none;
    pointer-events: visibleStroke;
    stroke-width: 16;
    cursor: pointer;

    &--mobile {
      stroke-width: 24;
    }
  }

  &__outline {
    stroke-width: 8;
    stroke-linecap: square;
    stroke: var(--color-secondary);
  }

  &__animation {
    stroke-width: 3;
    stroke-dasharray: 5;
    animation: animate1 500s infinite linear;
    stroke: var(--color-bg-primary);
    opacity: 0;

    &--on {
      opacity: 1;
    }
  }

  &__display {
    stroke-width: 6;
    stroke: var(--color-hi-z);
    transition: 0.25s stroke; // TODO

    &--on {
      stroke: var(--color-on);
      stroke: -webkit-focus-ring-color !important;
    }

    &--off {
      stroke: var(--color-off);
      stroke: -webkit-focus-ring-color !important;
    }
  }
}

// TODO: move to keyframes scss file?
@keyframes animate1 {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -10000;
  }
}

@keyframes animate2 {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes flash { // TODO: make this a mixin
  0% {
    filter: inherit;
  }
  50% {
    filter: drop-shadow(0px 0px 20px var(--color-primary));
  }
  100% {
    filter: inherit;
  }
}
</style>
