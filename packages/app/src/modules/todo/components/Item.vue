<template>
  <div class="item" :style="style">
    <slot />
    <Port
      v-for="port in ports"
      :id="port.id"
      :key="port.id"
      :rotation="rotation + parentRotation"
      :active="!!activePortType"
      @drag="portDrag"
      @dragStart="portDragStart"
      @dragEnd="portDragEnd"
    />
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

  get truePosition () {
    return {
      x: this.position.x - this.offset.x,
      y: this.position.y - this.offset.y
    }
  }

  @Prop({ default: 0 })
  public rotation: any

  @Prop({ default: 0 })
  public parentRotation: any

  @Prop({ default: false })
  public should: boolean

  @Prop({ default: () => [] })
  public ports: any[]

  @Prop({ default: null })
  public activePortType: any

  @Prop({
    default: () => ({})
  })
  public properties: any

  @Prop()
  public id: string

  get style () {
    return {
      left: `${this.truePosition.x}px`,
      top: `${this.truePosition.y}px`,
      transform: `rotate(${90 * this.rotation}deg)`
    }
  }

  portDragStart (data) {
    this.$emit('portDragStart', data)
  }

  portDrag (data) {
    this.$emit('portDrag', data)
  }

  portDragEnd (data) {
    this.$emit('portDragEnd', data)
  }
}
</script>

<style lang="scss">
.item {
  width: 100px;
  height: 185px;
  display: flex;
  background-color: green;
  position: absolute;
  flex-direction: column;
}

.inp {
  width: 50px;
  height: 30px;
  z-index: 2000;
}
</style>
