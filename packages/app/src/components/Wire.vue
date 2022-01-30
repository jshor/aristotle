<template>
  <svg class="wire"
    :class="{
      'wire--selected': isSelected
    }"
  :width="wire.width" :height="wire.height" :style="{
    top: `${topLeft.y + wire.minY}px`,
    left: `${topLeft.x + wire.minX}px`
  }"
  @mousedown="mousedown"
  >
    <defs>
      <filter id='inset' x='-50%' y='-50%' width='200%' height='200%'>
        <!--outside-stroke-->
        <feFlood flood-color="transparent" result="outside-color"/>
        <feMorphology in="SourceAlpha" operator="dilate" radius="2"/>
        <feComposite in="outside-color" operator="in" result="outside-stroke"/>
        <!--inside-stroke-->
        <feFlood flood-color="transparent" result="inside-color"/>
        <feComposite in2="SourceAlpha" operator="in" result="inside-stroke"/>
        <!--fill-area-->
        <feMorphology in="SourceAlpha" operator="erode" radius="2"/>
        <feComposite in="SourceGraphic" operator="in" result="fill-area"/>
        <!--merge graphics-->
        <feMerge>
          <feMergeNode in="outside-stroke"/>
          <feMergeNode in="inside-stroke"/>
          <feMergeNode in="fill-area"/>
        </feMerge>
      </filter>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#05a"/>
        <stop offset="100%" stop-color="#0a5"/>
      </linearGradient>
    </defs>
    <path
      class="wire__display"
      :class="{
        'wire__display--on': source.value === 1,
        'wire__display--off': source.value === -1
      }"
      fill="none"
      stroke="#868686"
      :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
      :d="wire.path" stroke-linecap="round" stroke-linejoin="round" opacity="1"
    />
    <path
      class="wire__clickable"
      fill="none"
      :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
      :d="wire.path" stroke-linecap="round" stroke-linejoin="round" opacity="1"
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

  &__clickable {
    animation: none;
    stroke-width: 16;
    pointer-events: all;
    cursor: pointer;
  }

  &__display {
    stroke-width: 6;
    pointer-events: all;
    stroke-dasharray: 14;
    animation: animate1 30s infinite linear;
    stroke-linejoin: bevel;
    stroke-linecap: square !important;
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
    opacity: 0.5;
  }
}

@keyframes animate1 {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -1000;
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
