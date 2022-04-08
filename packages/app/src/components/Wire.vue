<template>
  <svg class="wire"
    :class="{
      'wire--selected': isSelected
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
    isSelected: {
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
    stroke: pink;
  }

  &__display {
    stroke-width: 6;
    pointer-events: all;
    stroke-dasharray: 20;
    animation: animate1 300s infinite linear;
    stroke: darkred;

    &--on {
      stroke: green;
    }

    &--off {
      stroke: gray;
    }

    &--forward {
      animation: animate2 30s infinite linear;
    }
  }

  &--selected {
    filter: drop-shadow(3px 3px 2px rgba(0, 0, 0, .7));
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
</style>
