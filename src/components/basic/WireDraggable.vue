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
      data-test="wire-clickable"
      fill="none"
      ref="wireRef"
      :transform="`translate(${Math.abs(geometry.minX)}, ${Math.abs(geometry.minY)})`"
      :d="geometry.path"
      @mousedown.left="onLeftMouseDown"
      @mouseup="onMouseUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="dragEnd"
    />
  </svg>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import LogicValue from '../../types/enums/LogicValue'
import WireGeometry from '../../types/types/WireGeometry'
import { useDraggable } from '../../composables/useDraggable'
import Point from '../../types/interfaces/Point'

export default defineComponent({
  name: 'WireDraggable',
  props: {
    /** The wire Bezier curve geometry. */
    geometry: {
      type: Object as PropType<WireGeometry>,
      required: true
    },

    /** Whether or not to display marching ants to indicate electrical flow direction. */
    isAnimated: {
      type: Boolean,
      default: false
    },

    /** The logical value of the source port. */
    sourceValue: {
      type: Number as PropType<LogicValue>,
      required: true
    },

    /** The user-friendly label. */
    label: {
      type: String,
      default: ''
    },

    /** Whether or not this connection is a preview (i.e., opaque in appearance). */
    isPreview: {
      type: Boolean,
      default: false
    },

    /** Whether or not this wire should display as selected (i.e., with a select shadow). */
    isSelected: {
      type: Boolean,
      default: false
    },

    /** Whether or not the item should show a flash once to the user. */
    flash: {
      type: Boolean,
      default: false
    }
  },
  emits: {
    add: (point: Point, offset: Point) => true,
    move: (point: Point, offset: Point) => true,
    added: () => true,
    select: (deselectAll?: boolean) => true,
    deselect: () => true
  },
  setup (props, { emit }) {
    const wireRef = ref<SVGPathElement>()
    const isTouchDragging = ref(false)

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
        : emit('select', true)
    }

    /**
     * Drag start event handler.
     */
    function onDragStart (position: Point, offset: Point) {
      // if (!isTouchDragging.value) {
      //   emit('add', position, offset)
      // }
    }

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
      // onMouseDown($event)

      // if (!props.isSelected) {
      //   emit('select', !$event.ctrlKey)
      // }
    }

    const allowTouchDrag = computed(() => isTouchDragging.value)
    const {
      onMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      dragEnd,
    } = useDraggable({
      allowTouchDrag,
      longTouchTimeout: 500, // TODO: const
      onTouched,
      onDragStart,
      onDrag: (p: Point, o: Point) => emit('move', p, o),
      onDragEnd: () => onDragEnd()
    })

    return {
      wireRef,
      LogicValue,
      onLeftMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      dragEnd
    }
  }
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
    stroke-width: 16;
    pointer-events: visibleStroke;
    cursor: pointer;
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
