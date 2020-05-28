<template>
  <draggable class="group" @drag="onElemDrag" @dragEnd="dragEnd" :position="position" :zoom="zoom">
    <div class="group__rect" :style="{
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      transform: `rotate(${parentRotation * 90}deg)`
    }">
      <div class="group__container" />
      <item v-for="item in items" :id="item.id" :key="item.id" :ports="item.ports" :type="item.type"
      :position="items.length === 1 ? DEFAULT_POSITION : item.position" :rotation="item.rotation" :offset="rect" :parent-rotation="parentRotation" :properties="item.properties">
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
import { Getter } from '../store/decorators'

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

  @Getter('documents', 'zoom')
  public zoom: number

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

  @Watch('rotation')
  onRotate (newValue) {

    if (newValue === 0) return

    Vue.nextTick(() => {
      this.$store.dispatch('updateRotatedPositions', this.getItemPositions())

      // Vue.nextTick(() => {
          const ports = this.getPorts(this)
          this.portPositions = this.getPortPositions(ports)
          this.onElemDrag({
            position: this.position
          })
        this.rect = this.computeRect()
      // })
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

  getItemPositions () {
    const { top, left } = (this.$parent.$refs.canvas as any).getBoundingClientRect()

    return this
      .getItems(this)
      .reduce((p: any, item: any) => {
        const { offsetWidth, offsetHeight } = item.$el
        const { x, y, width, height } = item.$el.getBoundingClientRect()
        const scaledCenterX = x + (width / 2)
        const scaledCenterY = y + (height / 2)
        const centerX = scaledCenterX / this.zoom
        const centerY = scaledCenterY / this.zoom

        const position = {
          x: (centerX - (offsetWidth / 2)) - (left / this.zoom),
          y: (centerY - (offsetHeight / 2)) - (top / this.zoom)
        }

        return [...p, {
          id: item.id,
          position
        }]
      }, [])
  }

  ungroup () {
        this.getItemPositions().forEach((item) => {
          console.log('UNGROUP: ', item.position.x, item.position.y)
        })
    this.$emit('ungroup', this.getItemPositions())
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
      x = (rect.left - groupBBox.left) / this.zoom
      y = (rect.top - groupBBox.top) / this.zoom
    }

    return {
      x,
      y,
      width: (rect.right - rect.left) / this.zoom,
      height: (rect.bottom - rect.top) / this.zoom
    }
  }

  getPortPositions (ports: any[]) {
    const bbox = this.$el.getBoundingClientRect()

    return ports.map((port: any) => {
      const { id } = port.$options?.propsData || {}
      const { left, top } = port.$el.getBoundingClientRect()
      const x = (left - bbox.left) / this.zoom
      const y = (top - bbox.top) / this.zoom

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

  getAllDescendants (component: any, descendants: any[] = []) {
    return [
      ...descendants,
      ...component.$children,
      ...component.$children.reduce((children: any[], child: any) => {
        return this.getAllDescendants(child, children)
      }, [])
    ]
  }

  onElemDrag ({ position }) {
    console.log('updating ports')
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
    this.onElemDrag({ position })
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
