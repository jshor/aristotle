<template>
  <draggable
    :position="position"
    :zoom="zoom"
    :style="{
      transform: `rotate(${90 * rotation}deg)`
    }"
    class="item"
    :class="{
      'item--selected': isSelected
    }"
    :snap-mode="type === 'Freeport' ? 'radius' : 'outer'"
    :snap-boundaries="snapBoundaries"
    :bounding-box="boundingBox"
    :force-dragging="forceDragging"
    @drag-start="setSnapBoundaries(id)"
    @drag="position => setItemPosition({ id, position })"
    @mousedown="mousedown"
    @contextmenu="contextmenu"
  >
    <freeport v-if="type === 'Freeport'" />
    <logic-gate v-else />
    <port-set>
      <template
        v-for="(ports, orientation) in portList"
        v-slot:[orientation]
      >
        <port-item
          v-for="port in ports"
          :id="port.id"
          :ref="port.id"
          :key="port.id"
          :type="port.type"
          :is-freeport="port.isFreeport"
          :position="port.position"
          :orientation="port.orientation + rotation"
          :rotation="rotation"
          :snap-boundaries="snapBoundaries"
          :show-helper="port.showHelper"
        />
      </template>
    </port-set>
  </draggable>
</template>

<script lang="ts">
import ResizeObserver from 'resize-observer-polyfill'
import { mapActions, mapGetters } from 'vuex'
import { defineComponent, PropType } from 'vue'
import Draggable from '../components/Draggable.vue'
import LogicGate from '../components/LogicGate.vue'
import Freeport from '../components/Freeport.vue'
import PortSet from '../components/PortSet.vue'
import PortItem from './PortItem.vue'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'Item',
  components: {
    Draggable,
    LogicGate,
    Freeport,
    PortSet,
    PortItem
  },
  props: {
    position: {
      type: Object as PropType<Point>,
      default: () => ({
        x: 0,
        y: 0
      })
    },
    boundingBox: {
      type: Object,
      default: () => ({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      })
    },
    rotation: {
      type: Number,
      default: 0
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: null
    },
    ports: {
      type: Array,
      default: () => []
    },
    properties: {
      type: Object,
      default: () => ({})
    },
    groupId: {
      type: String,
      default: null
    },
    id: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      forceDragging: false
    }
  },
  mounted () {
    const observer = new ResizeObserver(this.onSizeChanged)

    observer.observe(this.$el)

    if (this.isSelected) {
      // if the item is selected when it is created, then it is actively being drawn
      // allow for it to be moved when the mouse moves on first creation
      this.forceDragging = true
    }
  },
  computed: {
    ...mapState([
      'snapBoundaries'
    ]),
    ...mapGetters([
      'zoom'
    ]),
    portList () {
      const locations = ['left', 'top', 'right', 'bottom']
      const ports = this.ports as Port[]

      return ports.reduce((map: { [l: string]: Port[] }, port: Port) => {
        if (!port) {
          console.log('UNDEFINED')
          return map
        }
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
  },
  methods: {
    filterByOrientation (orientation: number): Port[] {
      return (this.ports as Port[]).filter(p => p.orientation === orientation)
    },
    ...mapActions([
      'setSnapBoundaries',
      'setItemSize',
      'setItemPosition'
    ]),

    onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      if (target) {
        this.setItemSize({ id: this.id, rect: target.contentRect })
      }
    },

    mousedown ($event: MouseEvent) {
      this.$emit('select', $event)
    },

    contextmenu ($event: MouseEvent) {
      if (this.groupId === null) {
        // show a context menu for this item only if it is not part of a group
        console.log('Item context menu', this.id)
      } else {
        console.log('PARENT GROUP context menu')
      }

      $event.preventDefault()
    }
  }
})
</script>
