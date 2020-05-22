<template>
  <draggable class="group" @drag="onElemDrag" @dragEnd="dragEnd" :position="position">
    <div class="group__rect" :style="{
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      transform: `rotate(${parentRotation * 90}deg)`
    }">
      <div class="group__container" />
      <item v-for="item in items" :id="item.id" :key="item.id" :ports="item.ports" @portDrag="groupDrag" @portDragStart="portDragStart" @portDragEnd="portDragEnd" :activePortType="activePortType"
      :position="items.length === 1 ? DEFAULT_POSITION : item.position" :rotation="item.rotation" :offset="rect" :parent-rotation="parentRotation" :properties="item.properties"
      @updateProperties="updateProperties">
      </item>
    <slot />
    </div>
  </draggable>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import Draggable from './Draggable.vue'
import Port from './Port.vue'
import Item from './Item.vue'

@Component({
  components: {
    Draggable,
    Item
  }
})
export default class Group extends Vue {
  @Prop({
    default: () => ({
      x: 0,
      y: 0
    })
  })
  public position: any

  public DEFAULT_POSITION: any = { x: 0, y: 0 }

  @Prop()
  public id: string

  @Prop({ default: false })
  public destroyed: boolean

  @Prop()
  public activePortType: string

  @Prop({ default: () => [] })
  public items: any[]

  @Prop()
  public rotation: number

  get parentRotation () {
    return this.items.length > 1
      ? this.rotation
      : 0
  }

  groupDrag (data) {
    this.$emit('groupDrag', data)
  }
  portDragStart (data) {
    this.$emit('portDragStart', data)
  }
  portDragEnd (data) {
    this.$emit('portDragEnd', data)
  }
  updateProperties(data) {
    this.$emit('updateProperties', data)
  }

  @Watch('rotation')
  onRotate () {
    Vue.nextTick(() => {
      const ports = this.getPorts(this)

      this.portPositions = this.getPortPositions(ports)

      this.onElemDrag({
        position: this.position
      })
    })
  }

  @Watch('destroyed', { immediate: true })
  onDestroyed (destroyed) {
    if (destroyed) {
      // to ungroup items, the absolute item positions must be computed prior to destruction
      // using beforeDestroy() won't work in this case since the children would be moved out of
      // the group by the store first -- thus the group must first be told to destroy itself, then
      // told to compute/update the children positions in the store; then it can finally be destroyed
      this.ungroup()
    }
  }

  ungroup () {
    const positions = this
      .getItems(this)
      .reduce((p: any, item: any) => {
        const { offsetWidth, offsetHeight } = item.$el
        const { x, y, width, height } = item.$el.getBoundingClientRect()
        const centerX = x + width / 2
        const centerY = y + height / 2
        const position = {
          x: centerX - offsetWidth / 2,
          y: centerY - offsetHeight / 2
        }

        return [...p, {
          id: item.id,
          position
        }]
      }, [])

    this.$emit('ungroup', positions)
  }

  relativePostion (position) {
    return {
      x: position.x - this.position.x,
      y: position.y - this.position.y
    }
  }

  portPositions: any[] = []

  rect: any = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  mounted () {
    const ports = this.getPorts(this)

    this.portPositions = this.getPortPositions(ports)

    this.rect = this.computeRect()
      this.onElemDrag({
        position: this.position
      })
  }

  computeRect () {
    if (this.items.length === 1) {
      return {}
    }
    const groupBBox = this.$el.getBoundingClientRect()

    const rect = this
      .getItems(this)
      .reduce((totalBBox, child) => {
        const childBBox = child.$el.getBoundingClientRect()

        return {
          left: Math.min(totalBBox.left, childBBox.left),
          top: Math.min(totalBBox.top, childBBox.top),
          right: Math.max(totalBBox.right, childBBox.right),
          bottom: Math.max(totalBBox.bottom, childBBox.bottom)
        }
      }, {
        left: Infinity,
        top: Infinity,
        right: 0,
        bottom: 0
      })

    let x = 0
    let y = 0

    if (this.items.length > 1) {
      x = rect.left - groupBBox.left
      y = rect.top - groupBBox.top
    }

    return {
      x,
      y,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top
    }
  }

  getPortPositions (ports: any[]) {
    const bbox = this.$el.getBoundingClientRect()

    return ports.map((port: any) => {
      const { id } = port.$options?.propsData || {}
      const { left, top } = port.$el.getBoundingClientRect()
      const x = left - bbox.left
      const y = top - bbox.top

      return { x, y, id }
    })
  }

  getPorts (component: any) {
    return this.getAllDescendants(component)
      .filter((child: any) => child instanceof Port)
  }

  getItems (component: any) {
    return this.getAllDescendants(component)
      .filter((child: any) => child instanceof Item)
  }

  // getAllDescendants (component: any, ports: any[] = []) {
  //   return [
  //     ...ports,
  //     ...component.$children,//.filter((child: any) => child instanceof Port),
  //     ...component.$children.reduce((children: any[], child: any) => [
  //       ...children,
  //       ...this.getAllDescendants(child, children)
  //     ], [])
  //   ]
  // }


  getAllDescendants (component: any, descendants: any[] = []) {
    return [
      ...descendants,
      ...component.$children, // .filter((child: any) => child instanceof Item),
      ...component.$children.reduce((children: any[], child: any) => {
        return this.getAllDescendants(child, children)
      }, [])
    ]
  }

  onElemDrag ({ position }) {
    const portPositions = this
      .portPositions
      .reduce((positions: any, port: any) => ({
        ...positions,
        [port.id]: {
          position: {
            x: port.x + position.x,
            y: port.y + position.y
          }
        }
      }), {})

    this.$emit('drag', portPositions)
  }

  dragEnd ({ position }) {
    this.$emit('dragEnd', { id: this.id, position })
  }
}
</script>

<style lang="scss">
.group {
  background-color: rgba(0,0,0,0.5);
  box-sizing: border-box;
  position: absolute;

  &__container {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border: 1px dashed red;
  }

  &__rect {
    transform-origin: center;
    position: relative;
    box-sizing: border-box;
  }

  &__inner {
    position: relative;
    top: 0;
    left: 0;
  }
}
</style>
