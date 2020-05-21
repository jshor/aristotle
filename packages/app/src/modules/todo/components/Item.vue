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
    <button @click="updateSize">Resize</button>
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

  updateSize () {
    const properties = {
      inputCount: this.properties.inputCount > 1 ? 1 : 2
    }

    this.$emit('updateProperties', {
      id: this.id,
      properties
    })
  }

  @Watch('properties', { deep: true })
  resize () {
    this.$emit('resize')
  }

  get size () {
    if (this.properties.inputCount === 1) {
      return {
        width: 120,
        height: 200
      }
    }
    return {
      width: 170,
      height: 200
    }
  }

  @Prop()
  public id: string

  get style () {
    return {
      width: `${this.size.width}px`,
      height: `${this.size.height}px`,
      left: `${this.truePosition.x}px`,
      top: `${this.truePosition.y}px`,
      transform: `rotate(${90 * this.rotation}deg)`
    }
  }

  getRotatedPosition (oldRotation, newRotation) {
    if (oldRotation === newRotation) return
    console.log('OLD, NEW', oldRotation, newRotation, this.id)
    const rotation = 1 // (newRotation - oldRotation) % 3
    const groupBBox = (this.$el.parentNode as any).getBoundingClientRect()
    const groupCenterX = groupBBox.left + (groupBBox.width / 2)
    const groupCenterY = groupBBox.top + (groupBBox.height / 2)

    const itemBBox = this.$el.getBoundingClientRect()
    const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = this.$el as any
    const itemCenterX = (itemBBox.left + (itemBBox.width / 2))
    const itemCenterY = (itemBBox.top + (itemBBox.height / 2))

    const radians = rotation * 90 * (Math.PI / 180)

    let x = Math.cos(radians) * (itemCenterX - groupCenterX) - Math.sin(radians) * (itemCenterY - groupCenterY) + groupCenterX
    let y = Math.sin(radians) * (itemCenterX - groupCenterX) + Math.cos(radians) * (itemCenterY - groupCenterY) + groupCenterY

    console.log('ITEM CENTER: ', itemCenterX, itemCenterY)
    console.log('GROUP CENTER: ', groupCenterX, groupCenterY)

    x -= offsetWidth / 2
    y -= offsetHeight / 2
    //  return POINT(cos(angle) * (p.x - cx) - sin(angle) * (p.y - cy) + cx,
    //               sin(angle) * (p.x - cx) + cos(angle) * (p.y - cy) + cy);


    // console.log('CENTER: ', groupCenterX, groupCenterY)

    // const itemBBox = this.$el.getBoundingClientRect()
    // const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = this.$el as any
    // const itemCenterX = (itemBBox.left + (itemBBox.width / 2))
    // const itemCenterY = (itemBBox.top + (itemBBox.height / 2))

    // const relativeCenterX = groupCenterX - itemCenterX
    // const relativeCenterY = groupCenterY - itemCenterY

    // let x = relativeCenterX
    // let y = relativeCenterY

    // if (rotation === 1) {
    //   x = relativeCenterY
    //   y = -relativeCenterX
    // } else if (rotation === 2) {
    //   x = -relativeCenterY
    //   y = -relativeCenterX
    // } else if (rotation === 3) {
    //   x = -relativeCenterY
    //   y = relativeCenterX
    // }

    // x = groupCenterX + x
    // y = groupCenterY + y

    // x -= (offsetWidth / 2)
    // y -= (offsetHeight / 2)

    // console.log('FROM: ', itemBBox.left, itemBBox.top)
    // console.log('TO: ', x, y)

    // this.$emit('reposition', {
    //   id: this.id,
    //   position: { x, y }
    // })
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
