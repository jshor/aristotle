<template>
  <div class="item" :style="style">
    <div class="item__freeport" v-if="type === 'Freeport'" />
    <logic-gate v-else />
    <div
      v-for="(ports, orientation) in portList"
      :key="orientation"
      :class="`item__ports--${orientation}`"
      class="item__ports">
      <Port
        v-for="port in ports"
        :id="port.id"
        :key="port.id"
        :type="port.type"
        :siblings="portList"
        :position="position"
        :orientation="port.orientation"
        :rotation="rotation"
        :draggable="type !== 'Freeport'"
        :show-helper="port.showHelper"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import Port from './Port.vue'
import LogicGate from '../components/LogicGate.vue'

@Component({
  components: {
    LogicGate,
    Port
  }
})
export default class Item extends Vue {
  @Prop({
    default: () => ({
      x: 0,
      y: 0
    })
  })
  public position: any

  @Prop({
    default: () => ({
      x: 0,
      y: 0
    })
  })
  public offset: any

  @Prop({ default: 0 })
  public rotation: any

  @Prop()
  public type: any

  @Prop({ default: 0 })
  public parentRotation: any

  @Prop({ default: () => [] })
  public ports: any[]

  @Prop({
    default: () => ({})
  })
  public properties: any

  get truePosition () {
    return {
      x: this.position.x - this.offset.x,
      y: this.position.y - this.offset.y
    }
  }

  get portList () {
    const locations = ['left', 'top', 'right', 'bottom']

    return this
      .ports
      .reduce((map, port) => {
        return {
          ...map,
          [locations[port.orientation]]: [
            ...map[locations[port.orientation]],
            port
          ]
        }
      }, locations.reduce((m, type) => ({
        ...m, [type]: []
      }), {}))
  }

  @Prop()
  public id: string

  get style () {
    return {
      left: `${this.truePosition.x}px`,
      top: `${this.truePosition.y}px`,
      transform: `rotate(${90 * this.rotation}deg)`
    }
  }
}
</script>

<style lang="scss">
.item {
  box-sizing: border-box;
  position: absolute;

  &__freeport {
    width: 1px;
    height: 1px;
    background: blue;
  }

  &__ports {
    position: relative;
    display: flex;
    align-items: center;
    position: absolute;

    &--left, &--right {
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      width: 50%;
    }

    &--left {
      justify-content: flex-start;
    }

    &--right {
      left: 50%;
      justify-content: flex-end;
    }

    &--bottom, &--top {
      flex: 1;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      height: 50%;
      justify-content: center;
    }

    &--bottom {
      top: 50%;
      align-items: flex-end;
    }

    &--top {
      bottom: 50%;
      align-items: flex-start;
    }
  }
}
</style>
