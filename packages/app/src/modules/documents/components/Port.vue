<template>
  <div class="port" :title="rotation" :style="{
    transform: `rotate(-${rotation * 90}deg)`
  }">
    <!-- <div class="port__helper port__helper--vertical snappable" />
    <div class="port__helper port__helper--horizontal snappable" /> -->
    <div class="port__handle"  />
      <draggable class="port" @drag="onDrag" @dragStart="dragStart" @dragEnd="dragEnd" :position="draggablePosition" :data-id="id" :class="{ snappable }" v-if="draggable">
        <div class="port__handle" @mousedown="mousedown" @mouseup="mouseup" :class="{ 'port__handle--active': snappable }"  />
      </draggable>
      <slot />
    <!-- </div> -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import Draggable from './Draggable.vue'
import { Getter } from '../store/decorators'

@Component({
  components: {
    Draggable
  }
})
export default class Port extends Vue {

  @Getter('documents', 'zoom')
  public zoom: number

  @Prop()
  public id: string

  @Prop({ default: 0 })
  public rotation: any

  @Prop({ default: () => ({
    x: 0, y: 0
  }) })
  public position: any

  @Prop({ default: true })
  public draggable: boolean

  @Prop({ default: 0 })
  public type: number

  @Prop({ default: 0 })
  public orientation: number

  public cloneId: string = 'DRAGGED_PORT'

  public draggablePosition: any = {
    x: 0,
    y: 0
  }

  public absolutePosition: any = {
    x: 0,
    y: 0
  }

  get snappable () {
    const { activePort } = this.$store.state.documents

    return activePort !== null // && activePort.type !== this.type
  }

  setAbsolutePosition () {
    const parent = (this.$parent.$parent.$parent.$parent.$refs.canvas as any).getBoundingClientRect()
    const { x, y } = this.$el.getBoundingClientRect()

    this.absolutePosition = {
      x: x - (parent.x * this.zoom),
      y: y - (parent.y * this.zoom)
    }
  }

  mousedown () {
    this.setAbsolutePosition()
    this.setActivePort({
      id: this.cloneId,
      position: {
        x: 0,
        y: 0
      },
      type: this.type,
      orientation: this.orientation
    })
  }

  mouseup () {
    this.$store.dispatch('setActivePort', null)
  }

  dragStart ({ position }) {
    this.draggablePosition = {}
    this.onDrag(position)

    this.$store.dispatch('connect', {
      source: this.id,
      target: this.cloneId
    })
  }

  onDrag ({ position }) {
    if (!position) return
    this.$store.dispatch('updatePortPositions', {
      [this.cloneId]: {
        position: {
          x: position.x + this.absolutePosition.x,
          y: position.y + this.absolutePosition.y
        },
        id: this.cloneId,
        type: this.type,
        orientation: this.orientation,
        rotation: 0
      }
    })
  }

  dragEnd ({ position, snappedId }) {
    this.draggablePosition = {
      x: 0,
      y: 0
    }

    this.$store.dispatch('disconnect', {
      source: this.id,
      target: this.cloneId
    })
    this.$store.dispatch('connect', {
      source: this.id,
      target: snappedId
    })
    this.$store.dispatch('setActivePort', null)
  }

  setActivePort (port) {
    this.$store.dispatch('setActivePort', port)
  }
}
</script>

<style lang="scss">
.dr {
  background:blue;
}
.port {
  width: 0;
  height: 0;
  position: relative;

  &__helper {
    content: ' ';
    display: block;
    position: absolute;
    // background-color: rgba(255,0,0,1);

    &--vertical {
      width: 1px;
      left: -1px;
      top: -100vh;
      height: 200vh;
    }

    &--horizontal {
      height: 1px;
      left: -100vh;
      width: 200vh;
    }
  }


  &--rotated {
    transform: rotate(-90deg);
  }

  &__handle {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid black;
    box-sizing: border-box;
    top: -8px;
    left: -8px;
    width: 16px;
    height: 16px;
    background-color: red;
    border-radius: 50%;
    cursor: grab;
    transition: all 0.25s;
    z-index: 1001;

    &:active {
      cursor: grabbing;
    }

    &--active {
      width: 24px;
      height: 24px;
      top: -12px;
      left: -12px;
    }
  }
}
</style>
