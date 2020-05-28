<template>
  <div class="item" :style="style">
    <slot />
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
        :position="position"
        :orientation="port.orientation"
        :rotation="rotation"
        :draggable="port.type !== 2"
        :show-helper="port.showHelper"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import Port from './Port.vue'

@Component({
  components: {
    Port
  }
})
export default class List extends Vue {
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
    const style = {
      left: `${this.truePosition.x}px`,
      top: `${this.truePosition.y}px`,
      transform: `rotate(${90 * this.rotation}deg)`
    }

    if (this.type === 'Freeport') {
      return {
        ...style,
        width: 0,
        height: 0
      }
    }
    return {
        ...style,
      width: '100px',
      height: '185px'
    }
  }
}
</script>

<style lang="scss">
.item {
  display: flex;
  background-color: rgba(0, 255, 122, 0.2);
  border: 1px solid black;
  box-sizing: border-box;
  position: absolute;

  &__ports {
    position: relative;
    display: flex;
    align-items: center;

    &--left {
      left: 0;
      top: 0;
      bottom: 0;
      width: 50%;
    }

    &--right {
      top: 0;
      right: 0;
      bottom: 0;
      width: 50%;
      justify-content: flex-end;
    }

    &--top {
      flex: 1;
      left: 0;
      top: 0;
      right: 0;
      height: 50%;
      background: violet;
      align-items: flex-start;
    }

    &--bottom {
      flex: 1;
      top: 50%;
      left: 0;
      right: 0;
      bottom: 0;
      height: 50%;
      justify-content: center;
      align-items: flex-end;
  position: absolute;
    }
  }
}

.inp {
  width: 50px;
  height: 30px;
  z-index: 2000;
}
</style>
