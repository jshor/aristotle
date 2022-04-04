<template>
  <draggable
    :position="position"
    :zoom="zoom"
    :style="{
      transform: `rotate(${90 * rotation}deg)`,
      zIndex
    }"
    :class="{
      'item--selected': isSelected
    }"
    :snap-mode="type === ItemType.Freeport ? 'radius' : 'outer'"
    :snap-boundaries="snapBoundaries"
    :bounding-box="boundingBox"
    :force-dragging="forceDragging"
    :aria-label="name"
    :title="name"
    :tabindex="0"
    @keydown.esc="onEscapeKey"
    @drag-start="onDragStart"
    @drag="position => setSelectionPosition({ id, position })"
    @focus="onFocus"
    @blur="onBlur"
    @mousedown.stop="focus"
  >
    <properties
      v-if="isPropertiesEnabled"
      :properties="properties"
      :id="id"
      @update="setProperties"
      @focus="onPropertiesFocus"
      @blur="onBlur"
      aria-label="Properties dialog"
    />
    <freeport v-if="type === ItemType.Freeport" />
    <integrated-circuit v-else-if="type === ItemType.IntegratedCircuit" />
    <input-switch
      v-else-if="type === ItemType.InputNode"
      :value="ports[0].value"
      @toggle="value => setPortValue({ id: ports[0].id, value })"
    />
    <clock
      v-else-if="subtype === ItemSubtype.Clock"
      :value="ports[0].value"
      @toggle="value => setPortValue({ id: ports[0].id, value })"
    />
    <lightbulb
      v-else-if="type === ItemType.OutputNode"
      :value="ports[0].value"
      :type="subtype"
    />
    <logic-gate
      v-else
      :input-count="properties.inputCount?.value"
      :type="subtype"
    />
    <port-set v-if="type !== 'Freeport'">
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
          :connected-port-ids="port.connectedPortIds"
          :rotation="rotation"
          :show-helper="port.showHelper"
          @keypress.esc="onEscapeKey"
          @focus="$event => onPortFocus($event, port.id)"
          @blur="$event => onPortBlur($event, port.id)"
          @deselect="focus"
        />
      </template>
    </port-set>
    <port-handle
      v-else
      :active="hasFocus"
    />
  </draggable>
</template>

<script lang="ts">
import ResizeObserver from 'resize-observer-polyfill'
import { mapActions, mapGetters, mapState } from 'vuex'
import { defineComponent, PropType } from 'vue'
import Clock from '../components/item/elements/Clock.vue'
import Draggable from '../components/Draggable.vue'
import LogicGate from '../components/item/elements/LogicGate.vue'
import InputSwitch from '../components/item/elements/InputSwitch.vue'
import IntegratedCircuit from '../components/item/elements/IntegratedCircuit.vue'
import Lightbulb from '../components/item/elements/Lightbulb.vue'
import Freeport from '../components/item/Freeport.vue'
import PortHandle from '../components/PortHandle.vue'
import PortSet from '../components/item/PortSet.vue'
import Properties from '../components/item/Properties.vue'
import PortItem from './PortItem.vue'
import ItemType from '../types/enums/ItemType'
import ItemSubtype from '../types/enums/ItemSubtype'

export default defineComponent({
  name: 'Item',
  components: {
    Clock,
    Draggable,
    LogicGate,
    Freeport,
    InputSwitch,
    IntegratedCircuit,
    Lightbulb,
    PortHandle,
    PortSet,
    PortItem,
    Properties
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
      type: Object as PropType<BoundingBox>,
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
    zIndex: {
      type: Number,
      default: 0
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    type: {
      type: String as PropType<ItemType>,
      required: true
    },
    subtype: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: 'Node'
    },
    ports: {
      type: Array,
      default: () => []
    },
    properties: {
      type: Object as PropType<PropertySet>,
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
      forceDragging: false,
      showProperties: false,
      hasFocus: false,
      ItemSubtype,
      ItemType
    }
  },
  watch: {
    isSelected (isSelected: boolean) {
      if (isSelected) {
        this.$el.focus()
      }
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
      this.$el.focus()
    }

    this.setProperties({
      id: this.id,
      properties: this.properties
    })
  },
  computed: {
    ...mapState([
      'activePortId',
      'activeFreeportId',
      'snapBoundaries'
    ]),
    ...mapGetters([
      'zoom'
    ]),
    isPropertiesEnabled () {
      return this.isSelected && this.hasFocus && Object.keys(this.properties).length > 0
    },
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
      'commitState',
      'setSelectionPosition',
      'setActiveFreeportId',
      'setActivePortId',
      'setSnapBoundaries',
      'setItemSize',
      'setPortValue',
      'setProperties'
    ]),

    focus () {
      this.$el.focus()
    },

    onDragStart () {
      if (this.type !== ItemType.Freeport) {
        this.commitState()
      }
      this.setSnapBoundaries(this.id)
    },

    onEscapeKey ($event: KeyboardEvent) {
      if (document.activeElement === this.$el) {
        this.$el.blur()
      } else {
        $event.preventDefault()
      }
    },

    onBlur ($event: FocusEvent) {
      if (!this.$el.contains($event.relatedTarget as Node)) {
        this.hasFocus = false
      }
    },

    onFocus ($event: FocusEvent) {
      if (!this.isSelected) {
        this.$emit('select', {
          shiftKey: false
        })
      }

      this.hasFocus = true
    },

    onPropertiesFocus () {
      this.setActivePortId(null)
      this.hasFocus = true
    },

    onPortFocus ($event: FocusEvent, portId: string) {
      if (!this.isSelected) {
        this.$emit('select', {})
      }

      this.setActivePortId(portId)
      this.hasFocus = true
    },

    onPortBlur ($event: FocusEvent, portId: string) {
      if (this.activePortId === portId) {
        this.setActivePortId(null)
      }
      this.onBlur($event)
    },

    onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      if (target) {
        this.setItemSize({ id: this.id, rect: target.contentRect })
      }
    }
  }
})
</script>

<style lang="scss">
.item--selected {
  filter: sepia(1) contrast(200%);
}
</style>
