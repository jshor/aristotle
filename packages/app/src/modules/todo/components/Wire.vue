<template>
  <svg class="wire" :width="wire.width" :height="wire.height" :style="{
    top: `${topLeft.y + wire.minY}px`,
    left: `${topLeft.x + wire.minX}px`
  }"
  @click="addPoint">
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
  </defs>
    <path fill="none" stroke="#868686"
    :transform="`translate(${Math.abs(wire.minX)}, ${Math.abs(wire.minY)})`"
    :d="wire.path" class="draw2d_Connection" stroke-linecap="round" stroke-linejoin="round" stroke-width="8" stroke-dasharray="none" opacity="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round; opacity: 1;"

    ></path>
  </svg>
</template>

<script lang="ts">
const WIRE_PADDING = 15

import { Component, Vue, Prop } from 'vue-property-decorator';
import Draggable from './Draggable.vue'

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

  points: any[] = []

  addPoint ({ offsetX, offsetY }) {
    this.points.push({ x: offsetX, y: offsetY })
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

  subtract (a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    }
  }

  get wire () {
    const { a, b } = this

    // top left (b) to bottom right (a)
    let start = { x: 0, y: 0 }
    let end = this.subtract(a, b)

    if (a.x <= b.x) {
      if (a.y <= b.y) {
        // top left (a) to bottom right (b)
        end = this.subtract(b, a)
      } else {
        // bottom left (a) to top right (b)
        start = {
          x: 0,
          y: a.y - b.y
        }
        end = this.subtract(b, a)
        end.y = 0
      }
    } else if (a.y <= b.y) {
      // bottom left (b) to top right (a)
      start = this.subtract(b, a)
      start.x = 0
      end = this.subtract(a, b)
      end.y = 0
    }

    const fromDir = 1
    const toDir = 3

    const x1 = start.x
    const y1 = start.y

    const x4 = end.x
    const y4 = end.y

    const dx = Math.max(Math.abs(x1 - x4) / 2, 10)
    const dy = Math.max(Math.abs(y1 - y4) / 2, 10)

    const x2 = [x1, x1 + dx, x1, x1 - dx][fromDir].toFixed(3)
    const y2 = [y1 - dy, y1, y1 + dy, y1][fromDir].toFixed(3)
    const x3 = [x4, x4 + dx, x4, x4 - dx][toDir].toFixed(3)
    const y3 = [y4 - dy, y4, y4 + dy, y4][toDir].toFixed(3)

    const path = [
      'M', x1.toFixed(3), y1.toFixed(3),
      'C', x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)
    ].join(' ')

    const toNumArr = (...n) => n.map(k => parseInt(k, 10))

    const minX = Math.min(...toNumArr(x1, x2, x3, x4))
    const maxX = Math.max(...toNumArr(x1, x2, x3, x4))
    const minY = Math.min(...toNumArr(y1, y2, y3, y4)) - WIRE_PADDING / 2
    const maxY = Math.max(...toNumArr(y1, y2, y3, y4)) + WIRE_PADDING / 2

    const width = maxX - minX
    const height = maxY - minY + WIRE_PADDING

    return { width, height, path, minX, minY }
  }
}
</script>

<style lang="scss">
.wire {
  position: absolute;
  top: 0;
  left: 0;
  // pointer-events: none;
}
</style>
