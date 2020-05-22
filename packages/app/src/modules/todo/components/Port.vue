<template>
  <div class="port" :title="rotation" :style="{
    transform: `rotate(-${rotation * 90}deg)`
  }">
    <div class="port__handle" :class="{
      'port__handle--active': active
    }" />
      <draggable class="port" @drag="onDrag" @dragStart="dragStart" @dragEnd="dragEnd" :position="draggablePosition" :data-id="id" :class="{ snappable }">
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

@Component({
  components: {
    Draggable
  }
})
export default class Port extends Vue {

  @Prop()
  public id!: string

  @Prop({ default: 0 })
  public rotation: any

  @Prop({ default: false })
  public active: boolean

  @Prop()
  public type: number

  @Prop()
  public orientation: number

  public cloneId: string = 'DRAGGED_PORT'

  public draggablePosition: any = {
    x: 0,
    y: 0
  }

  get snappable () {
    const { activePort } = this.$store.state.documents

    return activePort !== null && activePort.type !== this.type
  }

  mousedown () {
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
    const { x, y } = this.$el.getBoundingClientRect()

    this.draggablePosition = {}
    this.onDrag(position)

    this.$store.dispatch('connect', {
      source: this.id,
      target: this.cloneId
    })
  }

  onDrag ({ position }) {
    this.$store.dispatch('updatePortPositions', {
      [this.cloneId]: {
        position,
        id: this.cloneId
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

  &--rotated {
    transform: rotate(-90deg);
  }

  &__handle {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: -8px;
    left: -8px;
    width: 16px;
    height: 16px;
    background-color: red;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.25s;
    z-index: 1001;

    &--active {
      width: 32px;
      height: 32px;
      top: -16px;
      left: -16px;
    }
  }
}
</style>
