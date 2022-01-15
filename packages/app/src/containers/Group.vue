<template>
  <draggable
    :position="position"
    :zoom="zoom"
    :class="{
      'group--selection': isSelection && items.length > 1
    }"
    class="group"
    @contextmenu="onContextMenu"
    @drag="onDrag"
  >
    <div
      :style="{
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        transform: `rotate(${parentRotation * 90}deg)`
      }"
      class="group__rect"
    >
      <div class="group__container" />
      <item
        v-for="item in items"
        :id="item.id"
        :key="item.id"
        :ref="item.id"
        :ports="item.ports"
        :type="item.type"
        :position="items.length === 1 ? DEFAULT_POSITION : item.position"
        :rotation="item.rotation"
        :offset="rect"
        :parent-rotation="parentRotation"
        :properties="item.properties"
        :is-selected="isSelection"
        @click="selectItem(item.id)"
        @contextmenu="selectItem(item.id)"
      />
    <slot />
  </div>
  </draggable>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { defineComponent, nextTick, PropType } from 'vue'
import IPoint from '../interfaces/IPoint'
import Draggable from './Draggable.vue'
import Item from './Item.vue'

type PortPosition = {
  id: string
  x: number
  y: number
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export default defineComponent({
  name: 'Group',
  components: {
    Draggable,
    Item
  },
  props: {
    position: {
      type: Object as PropType<IPoint>,
      default: () => ({
        x: 0,
        y: 0
      })
    },
    id: {
      type: String,
      default: ''
    },
    activePortType: {
      type: String,
      default: ''
    },
    items: {
      type: Array,
      default: () => []
    },
    rotation: {
      type: Number,
      default: 0
    },
    canvas: {
      type: Object as PropType<HTMLElement>,
      default: null
    }
  },
  data () {
    return {
      DEFAULT_POSITION: {
        x: 0,
        y: 0
      } as IPoint,
      portPositions: [] as PortPosition[],
      rect: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      } as Rect
    }
  },
  computed: {
    ...mapGetters([
      'zoom'
    ]),
    parentRotation () {
      return this.items.length > 1
        ? this.rotation
        : 0
    },
    isSelection () {
      return this.id === 'SELECTION'
    }
  },
  watch: {
    rotation: {
      handler (newValue) {
        nextTick(() => {
          this.updateRotatedPositions(this.getItemPositions())
          this.setPositions()
        })
      }
    }
  },
  mounted () {
    if (this.canvas) {
      this.setPositions()
    } else {
      nextTick(() => this.setPositions())
    }
  },
  methods: {
    ...mapActions([
      'deselectAll',
      'selectItems',
      'updateRotatedPositions',
      'updatePortPositions',
      'updateItemPosition'
    ]),

    setPositions () {
      const ports = this.getPorts()

      this.portPositions = this.getPortPositions(ports)
      this.rect = this.computeRect()
      this.onDrag({ position: this.position })
    },

    getItemPositions () {
      const { top, left } = this.canvas.getBoundingClientRect()

      return this
        .getItems()
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
    },

    computeRect (): Rect {
      if (this.items.length === 1) {
        return this.rect
      }

      const groupBBox = this.$el.getBoundingClientRect()

      const rect = this
        .getItems()
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
    },

    getPortPositions (ports: any[]): PortPosition[] {
      const bbox = this.$el.getBoundingClientRect()

      return ports.map((port: any) => {
        const { id } = port.$props || {}
        const { left, top } = port.$el.getBoundingClientRect()
        const x = (left - bbox.left) / this.zoom
        const y = (top - bbox.top) / this.zoom

        return { x, y, id }
      })
    },

    getPorts () {
      return this
        .getItems()
        .reduce((ports: any[], item: any) => [
          ...ports,
          ...Object.values(item.$refs).map((ref: any) => ref[0])
        ], [])
    },

    getItems () {
      return Object.values(this.$refs).map((ref: any) => ref[0])
    },

    onDrag ({ position }) {
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

      this.updatePortPositions(portPositions)
      this.updateItemPosition({ id: this.id, position })
    },

    onContextMenu ($event: MouseEvent) {
      if (this.isSelection) {
        console.log('clicked context menu')
        $event.preventDefault()
      }
    },

    selectItem (itemId) {
      if (!this.isSelection) {
        this.deselectAll()
        this.selectItems([itemId])
      }
    }
  }
})
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

  &--selection .group__container {
    border: 3px dashed red;
  }
}
</style>

