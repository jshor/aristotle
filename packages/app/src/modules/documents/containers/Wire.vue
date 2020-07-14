<template>
  <svg class="wire" :width="wire.width" :height="wire.height" :style="{
    top: `${topLeft.y + wire.minY}px`,
    left: `${topLeft.x + wire.minX}px`
  }"
  :class="{
    'wire--forward': wire.flowDirection === 1
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
    <path fill="none" stroke="#868686"
    :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
    :d="wire.path" class="draw2d_Connection" stroke-linecap="round" stroke-linejoin="round" opacity="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round; opacity: 1; cursor: pointer"

    ></path>
  </svg>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Draggable from './Draggable.vue'
import { Getter } from '../store/decorators'
import renderLayout from '../layout/wire'

@Component({
  components: {
    Draggable
  }
})
export default class Wire extends Vue {
  @Prop()
  public source: any;

  @Prop()
  public target: any;

  isMouseDown: boolean = false

  portCreated: boolean = false

  newFreeport: any = {}

  mouseCoords: any = {
    x: 0,
    y: 0
  }

  @Getter('documents', 'zoom')
  public zoom: number

  getPosition (event) {
    const { top, left } = (this.$parent.$refs.canvas as any).getBoundingClientRect()
    const x = (event.x - left) / this.zoom
    const y = (event.y - top) / this.zoom

    return { x, y }
  }

  mousedown (event) {
    const rand = () => 'X' + Math.random().toString().slice(-4)
    const { x, y } = this.getPosition(event)

    this.isMouseDown = true
    this.portCreated = false
    // this.newFreeportPortId = rand()
    this.newFreeport = {
      itemId: rand(),
      inputPortId: rand(),
      outputPortId: rand()
    }
    this.mouseCoords = { x, y }
  }

  originalA: any = {
    x: 0,
    y: 0
  }

  originalB: any = {
    x: 0,
    y: 0
  }

  mousemove (event) {
    if (!this.isMouseDown) return

    const position = this.getPosition(event)
    const { x, y } = position

    if ((this.mouseCoords.x !== x || this.mouseCoords.y !== y) && !this.portCreated) {
      this.$store.dispatch('createFreeport', {
        position,
        ...this.newFreeport,
        // portId: this.newFreeportPortId,
        sourceId: this.target.id,
        targetId: this.source.id
      })
      this.originalA = {...this.a}
      this.originalB = {...this.b}
      this.portCreated = true
    } else if (this.portCreated) {
      // const port = this.target && this.target.id === this.newFreeportPortId

      [this.originalA, this.originalB].forEach((wirePort) => {
        const diffX = Math.abs(position.x - wirePort.x)
        const diffY = Math.abs(position.y - wirePort.y)

        if (diffX < 10) {
          position.x += (wirePort.x - position.x)
        }
        if (diffY < 10) {
          position.y += (wirePort.y - position.y)
        }
      })

      this.$store.dispatch('updatePortPositions', {
        [this.newFreeport.inputPortId]: { position },
        [this.newFreeport.outputPortId]: { position }
      })
      this.$store.dispatch('updateItemPosition', {
        id: this.newFreeport.itemId,
        position
      })
    }
  }

  mouseup () {
    this.isMouseDown = false
    this.portCreated = false
  }

  mounted () {
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  }

  destroy () {
    window.removeEventListener('mousemove', this.mousemove)
    window.removeEventListener('mouseup', this.mouseup)
  }

  get a () {
    return this.source.position
  }

  get b () {
    return this.target.position
  }

  get topLeft () {
    const x = Math.min(this.a.x, this.b.x)
    const y = Math.min(this.a.y, this.b.y)

    return { x, y }
  }

  get bottomRight () {
    const x = Math.max(this.a.x, this.b.x)
    const y = Math.max(this.a.y, this.b.y)

    return { x, y }
  }

  get wire () {
    return renderLayout(this.source, this.target)
  }
}
</script>

<style lang="scss">
.wire {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;

  path {
    stroke-width: 6;
    pointer-events: all;
    stroke-dasharray: 14;
    animation: animate1 30s infinite linear;
    stroke-linejoin: bevel;
    stroke-linecap: square !important;
  }

  &--forward {
    path {
      animation: animate2 30s infinite linear;
    }
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
