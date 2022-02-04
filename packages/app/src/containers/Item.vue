<template>
  <draggable
    :position="position"
    :zoom="zoom"
    :style="{
      transform: `rotate(${90 * rotation}deg)`
    }"
    :class="{
      'item--selected': isSelected
    }"
    :snap-mode="type === 'Freeport' ? 'radius' : 'outer'"
    :snap-boundaries="snapBoundaries"
    :bounding-box="boundingBox"
    :force-dragging="forceDragging"
    @drag-start="dragStart"
    @drag="position => setItemPosition({ id, position })"
    @mousedown="mousedown"
    @contextmenu="contextmenu"
  >
    <freeport v-if="type === 'Freeport'" />
    <integrated-circuit v-else-if="type === 'IntegratedCircuit'" />
    <input-switch
      v-else-if="type === 'InputNode'"
      :value="ports[0].value"
      @toggle="value => setPortValue({ id: ports[0].id, value })"
    />
    <lightbulb
      v-else-if="type === 'OutputNode'"
      :value="ports[0].value"
    />
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
import { mapActions, mapGetters, mapState } from 'vuex'
import { defineComponent, PropType } from 'vue'
import Draggable from '../components/Draggable.vue'
import LogicGate from '../components/LogicGate.vue'
import InputSwitch from '../components/InputSwitch.vue'
import IntegratedCircuit from '../components/IntegratedCircuit.vue'
import Lightbulb from '../components/Lightbulb.vue'
import Freeport from '../components/Freeport.vue'
import PortSet from '../components/PortSet.vue'
import PortItem from './PortItem.vue'

export default defineComponent({
  name: 'Item',
  components: {
    Draggable,
    LogicGate,
    Freeport,
    InputSwitch,
    IntegratedCircuit,
    Lightbulb,
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

    if (this.activeFreeportId === this.id) {
      // if the item is selected when it is created, then it is actively being drawn
      // allow for it to be moved when the mouse moves on first creation
      this.forceDragging = true
      this.setActiveFreeportId(null)
    }
  },
  computed: {
    ...mapState([
      'activeFreeportId',
      'snapBoundaries'
    ]),
    ...mapGetters([
      'zoom'
    ]),
    portList () {
      const locations = ['left', 'top', 'right', 'bottom']
      const ports = this.ports as Port[]
      const map = ports.reduce((map: { [l: string]: Port[] }, port: Port) => ({
          ...map,
          [locations[port.orientation]]: [
            ...map[locations[port.orientation]],
            port
          ]
      }), locations.reduce((m, type) => ({
        ...m, [type]: []
      }), {
        left: [],
        top: [],
        right: [],
        bottom: []
      }))

      map.right = map.right.reverse()

      return map
    }
  },
  methods: {
    ...mapActions([
      'cacheState',
      'setActiveFreeportId',
      'setSnapBoundaries',
      'setItemSize',
      'setItemPosition',
      'setPortValue'
    ]),

    onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      if (target) {
        this.setItemSize({ id: this.id, rect: target.contentRect })
      }
    },

    dragStart () {
      if (this.type !== 'Freeport') {
        this.cacheState()
      }
      this.setSnapBoundaries(this.id)
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

<style lang="scss">
.item--selected {
  filter: sepia(1) contrast(200%);
}
</style>
