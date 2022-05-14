<template>
  <draggable
    :position="position"
    :zoom="store.zoomLevel"
    :style="{
      transform: `rotate(${90 * rotation}deg)`,
      outline: 'none',
      zIndex
    }"
    :snap-mode="type === ItemType.Freeport ? 'radius' : 'outer'"
    :snap-boundaries="store.snapBoundaries"
    :bounding-box="boundingBox"
    :force-dragging="forceDragging"
    :aria-label="name"
    :title="name"
    :tabindex="0"
    @drag-start="onDragStart"
    @drag="onDrag"
    @drag-end="onDragEnd"
    @focus="onFocus"
    @blur="onBlur"
    @keydown.esc="onEscapeKey"
    @mousedown.stop="onMouseDown"
    ref="selectable"
    data-test="selectable"
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
      data-test="properties"
    />
    <selectable
      :is-selected="isSelected"
      :flash="flash"
    >
      <freeport v-if="type === ItemType.Freeport" />
      <integrated-circuit
        v-else-if="type === ItemType.IntegratedCircuit"
        :port-list="portList"
        @dblclick="$emit('openIntegratedCircuit')"
      />
      <input-switch
        v-else-if="type === ItemType.InputNode"
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
            :key="port.id"
            :type="port.type"
            :is-freeport="port.isFreeport"
            :position="port.position"
            :orientation="port.orientation + rotation"
            :connected-port-ids="port.connectedPortIds"
            :rotation="rotation"
            @keypress.esc="onEscapeKey"
            @focus="onPortFocus(port.id)"
            @blur="$event => onPortBlur(port.id, $event)"
            @deselect="focus"
            data-test="port-item"
          />
        </template>
      </port-set>
    </selectable>
  </draggable>
</template>

<script lang="ts">
import ResizeObserver from 'resize-observer-polyfill'
import { StoreDefinition } from 'pinia'
import { defineComponent, PropType, onMounted, ref, ComponentPublicInstance, computed } from 'vue'
import Draggable from '@/components/Draggable.vue'
import LogicGate from '@/components/item/elements/LogicGate.vue'
import InputSwitch from '@/components/item/elements/InputSwitch.vue'
import IntegratedCircuit from '@/components/item/elements/IntegratedCircuit.vue'
import Lightbulb from '@/components/item/elements/Lightbulb.vue'
import Freeport from '@/components/item/Freeport.vue'
import PortHandle from '@/components/PortHandle.vue'
import PortSet from '@/components/item/PortSet.vue'
import Properties from '@/components/item/Properties.vue'
import Selectable from '@/components/Selectable.vue'
import PortItem from './PortItem.vue'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import DocumentState from '@/store/DocumentState'

/**
 * This component represents a two-dimensional item in the editor.
 * This can take on the form of a logic gate, input switch, lightbulb, user label, and more.
 * Items also contain ports, which are the circles that wires attach to to provide or send signals.
 */
export default defineComponent({
  name: 'Item',
  components: {
    Draggable,
    LogicGate,
    Freeport,
    InputSwitch,
    IntegratedCircuit,
    Lightbulb,
    PortHandle,
    PortSet,
    PortItem,
    Properties,
    Selectable
  },
  props: {
    /**
     * Bounding box of the item.
     */
    boundingBox: {
      type: Object as PropType<BoundingBox>,
      default: () => ({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      })
    },

    /**
     * The directional rotation of the item.
     *
     * @values 0 = Left, 1, 2, 3
     */
    rotation: {
      type: Number,
      default: 0
    },

    /**
     * CSS z-index value.
     */
    zIndex: {
      type: Number,
      default: 1
    },

    /**
     * Whether or not the item is selected.
     */
    isSelected: {
      type: Boolean,
      default: false
    },

    /**
     * High-level taxonomy of the item.
     */
    type: {
      type: String as PropType<ItemType>,
      required: true
    },

    /**
     * More specific taxnommy of the item.
     */
    subtype: {
      type: String,
      required: true
    },

    /**
     * x-y position of the item in the editor.
     */
    position: {
      type: Object as PropType<Point>,
      required: true
    },

    /**
     * Optional user-friendly name of the item.
     */
    name: {
      type: String,
      default: 'Node'
    },

    /**
     * List of port IDs associated with the item.
     */
    portIds: {
      type: Array as PropType<string[]>,
      default: () => []
    },

    /**
     * Optional editable properties.
     */
    properties: {
      type: Object as PropType<PropertySet>,
      default: () => ({})
    },

    /**
     * ID of the group the item is associated to (if any).
     */
    groupId: {
      type: String,
      default: null
    },

    /**
     * Item ID.
     */
    id: {
      type: String,
      required: true
    },

    /** Whether or not the item should show a flash once to the user. */
    flash: {
      type: Boolean,
      default: false
    },

    /**
     * Document store instance.
     */
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const selectable = ref<ComponentPublicInstance<HTMLElement>>()
    const forceDragging = ref(false)

    let hasFocus = false
    let isDragging = false

    /* list of all ports that belong to this item */
    const ports = computed(() => {
      return props
        .portIds
        .map(portId => store.ports[portId])
    })

    /* slot-to-port-list map for displaying port-item elements */
    const portList = computed(() => {
      const locations = ['left', 'top', 'right', 'bottom']

      return ports.value.reduce((map: Record<string, Port[]>, port: Port) => ({
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
    })

    /* whether or not the properties trigger button should be visible */
    const isPropertiesEnabled = computed(() => {
      return props.isSelected && hasFocus && Object.keys(props.properties).length > 0
    })

    /**
     * Places the window focus on the item element.
     */
    function focus () {
      selectable.value?.$el.focus()
      hasFocus = true
    }

    /**
     * Item drag start event handler.
     * This will compute the snappable boundaries on the editor.
     */
    function onDragStart () {
      store.setSnapBoundaries(props.id)
    }

    /**
     * Item drag event handler.
     * This will cache the undo-able state if dragged for the first time.
     *
     * @param position - new position that item has moved to
     */
    function onDrag (position: Point) {
      if (!isDragging) {
        isDragging = true
        store.cacheState() // cache the undo-able state in case a drag completes
      }

      store.setSelectionPosition({ id: props.id, position })
    }

    /**
     * Item drag end event handler.
     * This will commit the cached undo-able state.
     */
    function onDragEnd () {
      if (isDragging) {
        store.commitCachedState()
        isDragging = false
      }
    }

    /**
     * Inverts the selection state the item.
     */
    function onMouseDown ($event: MouseEvent) {
      if (props.isSelected) {
        store.deselectItem(props.id)
      } else {
        store.selectItem(props.id, $event.ctrlKey)
      }

      focus()
    }

    /**
     * Escape keydown event handler.
     * This will blur the element if neither it nor any of its children are focused.
     *
     * @param $event
     */
    function onEscapeKey ($event: KeyboardEvent) {
      if (document.activeElement === selectable.value?.$el) {
        selectable.value?.$el.blur()
      } else {
        $event.preventDefault()
      }
    }

    /**
     * Item blur event handler.
     * Updates `hasFocus` to false if the selection has left the item and any of its children.
     */
    function onBlur ($event: FocusEvent) {
      if (!selectable.value?.$el.contains($event.relatedTarget as Node)) {
        hasFocus = false
      }
    }

    /**
     * Item focus event handler.
     */
    function onFocus () {
      setTimeout(() => {
        if (!props.isSelected) {
          store.selectItem(props.id)
        }
      })

      hasFocus = true
    }

    /**
     * Properties dialog trigger button focus event handler.
     */
    function onPropertiesFocus () {
      store.setActivePortId(null)
      hasFocus = true
    }

    /**
     * Port focus event handler.
     *
     * @param portId - ID of the port focused
     */
    function onPortFocus (portId: string) {
      onFocus()
      store.setActivePortId(portId)
    }

    /**
     * Port blur event handler.
     *
     * @param portId - ID of the port blurred
     * @param $event - focus event
     */
    function onPortBlur (portId: string, $event: FocusEvent) {
      if (store.activePortId === portId) {
        store.setActivePortId(null)
      }
      onBlur($event)
    }

    /**
     * Item resize event handler. This will inform the store of the new size of the item.
     *
     * @param targets - target element that has been resized
     */
    function onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      store.setItemSize({
        id: props.id,
        rect: target.contentRect
      })
    }

    const observer = new ResizeObserver(onSizeChanged)

    onMounted(() => {
      if (selectable.value) {
        observer.observe(selectable.value.$el)
      }

      if (store.activeFreeportId === props.id) {
        // if the item is an active freeport, then it is actively being drawn
        // allow for it to be moved when the mouse moves on first creation
        forceDragging.value = true
        store.activeFreeportId = null
        isDragging = true
      }

      store.setProperties({
        id: props.id,
        properties: props.properties
      })
    })

    return {
      selectable,
      store,
      ports,
      rawStore: props.store,
      portList,
      forceDragging,
      isPropertiesEnabled,
      focus,
      onDragStart,
      onDrag,
      onDragEnd,
      onMouseDown,
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
