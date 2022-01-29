<template>
  <svg class="wire"
    :class="{
      'wire--selected': isSelected
    }"
  :width="wire.width" :height="wire.height" :style="{
    top: `${topLeft.y + wire.minY}px`,
    left: `${topLeft.x + wire.minX}px`
  }"
  @mousedown="mousedown">
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
        'wire__display--forward': wire.flowDirection === 1
      }"
     fill="none" stroke="#868686"
    :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
    :d="wire.path" stroke-linecap="round" stroke-linejoin="round" opacity="1"

    ></path>
  <path class="wire__clickable" fill="none"
    :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
    :d="wire.path" stroke-linecap="round" stroke-linejoin="round" opacity="1"

  ></path>
  </svg>
</template>

<script lang="ts">
import renderLayout from '../layout/wire'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import IPoint from '../interfaces/IPoint'

export default defineComponent({
  name: 'Wire',
  props: {
    source: {
      type: Object,
      required: true
    },
    target: {
      type: Object,
      required: true
    },
    groupId: {
      type: String,
      default: null
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      newFreeport: {
        itemId: '',
        inputPortId: '',
        outputPortId: '',
        sourceId: '',
        targetId: '',
        position: {}
      },
      originalPosition: {
        x: 0,
        y: 0
      } as IPoint,
      portCreated: false,
      isMouseDown: false
    }
  },
  computed: {
    ...mapGetters([
      'zoom'
    ]),
    a () {
      return this.source.position
    },
    b () {
      return this.target.position
    },
    topLeft () {
      const x = Math.min(this.a.x, this.b.x)
      const y = Math.min(this.a.y, this.b.y)

      return { x, y }
    },
    bottomRight () {
      const x = Math.max(this.a.x, this.b.x)
      const y = Math.max(this.a.y, this.b.y)

      return { x, y }
    },
    wire () {
      return renderLayout(this.source, this.target)
    }
  },
  mounted () {
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  },
  destroy () {
    window.removeEventListener('mousemove', this.mousemove)
    window.removeEventListener('mouseup', this.mouseup)
  },
  methods: {
    ...mapActions([
      'createFreeport',
      'setSnapBoundaries'
    ]),

    mousedown ($event: MouseEvent) {
      if (this.groupId !== null) {
        // this wire is part of a group, so do not allow the creation of a new freeport
        return
      }

      this.portCreated = false
      this.isMouseDown = true
      this.originalPosition = {
        x: $event.clientX,
        y: $event.clientY
      }
    },

    mousemove ($event: MouseEvent) {
      if (this.originalPosition.x === $event.clientX && this.originalPosition.y === $event.clientY) return
      if (!this.isMouseDown) return

      this.originalPosition = {
        x: $event.clientX,
        y: $event.clientY
      }

      if (!this.portCreated) {
        const rand = () => `id_${(Math.floor(Math.random() * 1000000) + 5)}` // TODO: use uuid
        const { top, left } = this.$el.getBoundingClientRect() as DOMRectReadOnly
        const relativePosition: IPoint = {
          x: $event.clientX - left,
          y: $event.clientY - top
        }
        const absolutePosition: IPoint = {
          x: this.topLeft.x + relativePosition.x,
          y: this.topLeft.y + relativePosition.y
        }

        this.newFreeport = {
          itemId: rand(),
          inputPortId: rand(),
          outputPortId: rand(),
          sourceId: this.target.id,
          targetId: this.source.id,
          position: absolutePosition
        }

        this.createFreeport(this.newFreeport)
        this.setSnapBoundaries(this.newFreeport.itemId)
        this.portCreated = true
      }
    },

    mouseup ($event: MouseEvent) {
      if (!this.isMouseDown) return

      this.isMouseDown = false
      this.$emit('select', $event)
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
    stroke-dashoffset: -1000;
  }
  to {
    stroke-dashoffset: 0;
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
