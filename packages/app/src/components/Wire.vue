<template>
  <svg class="wire"
    :class="{
      'wire--selected': isSelected,
      'wire--flash': flash,
      'wire--preview': isPreview
    }"
  :width="wire.width" :height="wire.height" :style="{
    top: `${topLeft.y + wire.minY}px`,
    left: `${topLeft.x + wire.minX}px`
  }"
  >
    <title>{{ label }}</title>
    <path
      class="wire__outline"
      fill="none"
      :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
      :d="wire.path"
    />
    <path
      class="wire__display"
      :class="{
        'wire__display--on': source.value === 1,
        'wire__display--off': source.value === -1
      }"
      fill="none"
      :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
      :d="wire.path"
    />
    <path
      v-if="isAnimated"
      class="wire__animation"
      fill="none"
      :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
      :d="wire.path"
    />
    <path
      class="wire__clickable"
      fill="none"
      :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
      :d="wire.path"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import renderLayout from '../layout/wire'

export default defineComponent({
  name: 'Wire',
  props: {
    isAnimated: {
      type: Boolean,
      default: false
    },
    source: {
      type: Object as PropType<Port>,
      required: true
    },
    target: {
      type: Object as PropType<Port>,
      required: true
    },
    topLeft: {
      type: Object as PropType<Point>,
      required: true
    },
    bottomRight: {
      type: Object as PropType<Point>,
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    isPreview: {
      type: Boolean,
      default: false
    },
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
  computed: {
    wire () {
      return renderLayout(this.source, this.target)
    }
  }
})
</script>

<style lang="scss">
.wire {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  outline: none;

  &__clickable {
    animation: none;
    stroke-width: 16;
    pointer-events: all;
    cursor: pointer;
  }

  &__outline {
    stroke-width: 8;
    pointer-events: all;
    stroke-linecap: square;
    stroke: $color-secondary;
  }

  &__animation {
    stroke-width: 1;
    pointer-events: all;
    stroke-dasharray: 5;
    animation: animate1 500s infinite linear;
    stroke: #fff;
  }

  &__display {
    stroke-width: 6;
    pointer-events: all;
    stroke: darkred;
    transition: 0.25s stroke; // TODO

    &--on {
      stroke: green;
    }

    &--off {
      stroke: gray;
    }
  }

  &--selected {
    filter: drop-shadow(0 0 6px $color-secondary); // TODO: make this a mixin
  }

  &--preview {
    opacity: 0.5;
  }

  &--flash {
    animation: flash 1s normal ease-out; // TODO: make this a mixin
  }
}

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
    filter: drop-shadow(0px 0px 20px $color-primary);
  }
  100% {
    filter: inherit;
  }
}
</style>
