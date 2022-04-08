<template>
  <draggable
    :position="position"
    :zoom="store.zoomLevel"
    :style="{
      transform: `rotate(${90 * rotation}deg)`,
      zIndex
    }"
    :class="{
      'item--selected': isSelected
    }"
    :snap-mode="type === ItemType.Freeport ? 'radius' : 'outer'"
    :snap-boundaries="store.snapBoundaries"
    :bounding-box="boundingBox"
    :force-dragging="forceDragging"
    :aria-label="name"
    :title="name"
    :tabindex="0"
    @keydown.esc="onEscapeKey"
    @drag-start="onDragStart"
    @drag="position => store.setSelectionPosition({ id, position })"
    @focus="onFocus"
    @blur="onBlur"
    @mousedown.stop="focus"
    ref="root"
  >
    <properties
      v-if="isPropertiesEnabled"
      :tabindex="0"
      :properties="properties"
      :id="id"
      @update="store.setProperties"
      @focus="onPropertiesFocus"
      @blur="onBlur"
      aria-label="Properties dialog"
    />
    <div class="item__content">
      <freeport v-if="type === ItemType.Freeport" />
      <integrated-circuit v-else-if="type === ItemType.IntegratedCircuit" />
      <input-switch
        v-else-if="type === ItemType.InputNode"
        :value="ports[0]?.value"
        @toggle="value => store.setPortValue({ id: ports[0].id, value })"
      />
      <clock
        v-else-if="subtype === ItemSubtype.Clock"
        :value="ports[0]?.value"
        @toggle="value => store.setPortValue({ id: ports[0].id, value })"
      />
      <lightbulb
        v-else-if="type === ItemType.OutputNode"
        :value="ports[0]?.value"
        :type="subtype"
      />
      <logic-gate
        v-else
        :input-count="(properties.inputCount?.value as number)"
        :type="subtype"
      />
      <port-set>
        <template
          v-for="(ports, orientation) in portList"
          v-slot:[orientation]
        >
          <port-item
            v-for="port in ports"
            :tabindex="0"
            :store="rawStore"
            :id="port.id"
            :ref="port.id"
            :key="port.id"
            :type="port.type"
            :is-freeport="port.isFreeport"
            :position="port.position"
            :orientation="port.orientation + rotation"
            :connected-port-ids="port.connectedPortIds"
            :rotation="rotation"
            @keypress.esc="onEscapeKey"
            @focus="$event => onPortFocus($event, port.id)"
            @blur="$event => onPortBlur($event, port.id)"
            @deselect="focus"
          />
        </template>
      </port-set>
    </div>
  </draggable>
</template>

<script lang="ts">
import ResizeObserver from 'resize-observer-polyfill'
import { StoreDefinition } from 'pinia'
import { defineComponent, PropType, onMounted, reactive, ref, ComponentPublicInstance, computed } from 'vue'
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
import DocumentState from '@/store/DocumentState'

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
    position: {
      type: Object as PropType<Point>,
      required: true
    },
    name: {
      type: String,
      default: 'Node'
    },
    portIds: {
      type: Array as PropType<string[]>,
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
    },
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props, { emit }) {
    const store = props.store()
    const root = ref<ComponentPublicInstance<HTMLElement>>()
    const forceDragging = ref(false)
    let hasFocus = false

    const ports = computed(() => {
      return props
        .portIds
        .map(portId => store.ports[portId])
    })
    const portList = computed(() => {
      const locations = ['left', 'top', 'right', 'bottom']
      const map = ports.value.reduce((map: Record<string, Port[]>, port: Port) => ({
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
    })
    const isPropertiesEnabled = computed(() => {
      return props.isSelected && hasFocus && Object.keys(props.properties).length > 0
    })

    function focus () {
      root.value?.$el.focus()
    }

    function onDragStart () {
      if (props.type !== ItemType.Freeport) {
        store.commitState()
      }
      store.setSnapBoundaries(props.id)
    }

    function onEscapeKey ($event: KeyboardEvent) {
      if (document.activeElement === root.value?.$el) {
        root.value?.$el.blur()
      } else {
        $event.preventDefault()
      }
    }

    function onBlur ($event: FocusEvent) {
      if (!root.value?.$el?.contains($event.relatedTarget as Node)) {
        hasFocus = false
      }
    }

    function onFocus ($event: FocusEvent) {
      if (!props.isSelected) {
        emit('select')
      }

      hasFocus = true
    }

    function onPropertiesFocus () {
      store.setActivePortId(null)
      hasFocus = true
    }

    function onPortFocus ($event: FocusEvent, portId: string) {
      if (!props.isSelected) {
        emit('select')
      }

      store.setActivePortId(portId)
      hasFocus = true
    }

    function onPortBlur ($event: FocusEvent, portId: string) {
      if (store.activePortId === portId) {
        store.setActivePortId(null)
      }
      onBlur($event)
    }

    function onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      if (target) {
        store.setItemSize({ id: props.id, rect: target.contentRect as DOMRectReadOnly })
      }
    }

    const observer = new ResizeObserver(onSizeChanged)

    onMounted(() => {
      if (root.value) {
        observer.observe(root.value.$el)
      }

      if (store.activeFreeportId === props.id) {
        // if the item is selected when it is created, then it is actively being drawn
        // allow for it to be moved when the mouse moves on first creation
        forceDragging.value = true

        store.setActiveFreeportId(null)
      }

      store.setProperties({
        id: props.id,
        properties: props.properties
      })
    })

    return {
      root,
      store,
      ports,
      rawStore: props.store,
      portList,
      forceDragging,
      isPropertiesEnabled,
      focus,
      onDragStart,
      onEscapeKey,
      onBlur,
      onFocus,
      onPropertiesFocus,
      onPortFocus,
      onPortBlur,
      onSizeChanged,
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
  }
})
</script>

<style lang="scss">
.item--selected {
  outline: none;
}

.item--selected .item__content {
  filter: drop-shadow(3px 3px 2px rgba(0, 0, 0, .7));
}
</style>
