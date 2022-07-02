<template>
  <draggable
    :style="{
      transform: `rotate(${90 * item.rotation}deg)`,
      outline: 'none',
      pointerEvents: 'none',
      zIndex
    }"
    :position="item.position"
    :is-selected="isSelected"
    :allow-touch-drag="isSelected"
    @resize="onResize"
    @keydown.esc="onEscapeKey"
    @drag="onDrag"
    @drag-start="onDragStart"
    @drag-end="store.commitCachedState"
    @select="k => store.selectItem(id, k)"
    @deselect="store.deselectItem(id)"
    ref="itemRef"
    data-test="item"
  >
    <properties
      v-if="isPropertiesEnabled"
      :properties="item.properties"
      :id="id"
      :viewport="viewport"
      @update="store.setProperties"
      @focus="store.setActivePortId(null)"
      @pan="store.panDelta"
      aria-label="Properties dialog"
      data-test="properties"
    />
    <circuit-component
      :type="item.type"
      :subtype="item.subtype"
      :ports="ports"
      :properties="item.properties"
      :is-selected="isSelected"
      :flash="flash"
      @change="store.setPortValue"
    >
      <template
        v-for="(port, o) in 4"
        v-slot:[o]
      >
        <port-item
          v-for="port in ports.filter(p => p.orientation === o)"
          :tabindex="0"
          :store="$props.store"
          :id="port.id"
          :key="port.id"
          :type="port.type"
          :position="port.position"
          :orientation="port.orientation + item.rotation"
          :connected-port-ids="port.connectedPortIds"
          :hue="port.isMonitored ? port.hue : 0"
          :rotation="item.rotation"
          @keypress.esc="onEscapeKey"
          @focus="store.setActivePortId(port.id)"
          @blur="onPortBlur(port.id)"
          @deselect="focus"
          data-test="port-item"
        />
      </template>
    </circuit-component>
  </draggable>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, ComponentPublicInstance } from 'vue'
import CircuitComponent from '@/components/item/CircuitComponent.vue'
import Properties from '@/components/item/Properties.vue'
import PortHandle from '@/components/PortHandle.vue'
import PortItem from './PortItem.vue'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import { DocumentStore } from '@/store/document'
import Draggable from '@/components/interactive/Draggable.vue'

/**
 * This component represents a two-dimensional item in the editor.
 * This can take on the form of a logic gate, input switch, lightbulb, user label, and more.
 * Items also contain ports, which are the circles that wires attach to to provide or send signals.
 */
export default defineComponent({
  name: 'Item',
  components: {
    CircuitComponent,
    Draggable,
    PortItem,
    PortHandle,
    Properties
  },
  props: {
    /** CSS z-index value. */
    zIndex: {
      type: Number,
      default: 1
    },

    /** Whether or not the item is selected. */
    isSelected: {
      type: Boolean,
      default: false
    },

    /** Item ID. */
    id: {
      type: String,
      required: true
    },

    /** Whether or not the item should show a flash once to the user. */
    flash: {
      type: Boolean,
      default: false
    },

    /** Document store instance. */
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const item = computed(() => store.items[props.id])
    const viewport = computed(() => store.viewport)
    const itemRef = ref<ComponentPublicInstance<HTMLElement>>()

    /* list of all ports that belong to this item */
    const ports = computed(() => {
      return store
        .items[props.id]
        .portIds
        .map(portId => store.ports[portId])
    })

    /* whether or not the properties trigger button should be visible */
    const isPropertiesEnabled = computed(() => {
      return props.isSelected && store.selectedItemIds.length === 1 && item.value.type !== ItemType.Freeport
    })

    /**
     * Places the window focus on the item element.
     */
    function focus () {
      itemRef.value?.$el.focus()
    }

    function onDragStart () {
      store.cacheState() // cache the undo-able state in case a drag completes
      store.setSnapBoundaries(props.id)
    }

    /**
     * Item drag event handler.
     * This will cache the undo-able state if dragged for the first time.
     *
     * @param position - new position that item has moved to
     * @param offset - the drag point w.r.t. the center of the item
     */
    function onDrag (position: Point, offset: Point) {
      store.dragItem(props.id, {
        x: position.x - offset.x - item.value.width / 2 * store.zoomLevel,
        y: position.y - offset.y - item.value.height / 2 * store.zoomLevel
      })
    }

    /**
     * Escape keydown event handler.
     * This will blur the element if neither it nor any of its children are focused.
     */
    function onEscapeKey ($event: KeyboardEvent) {
      if (document.activeElement === itemRef.value?.$el) {
        itemRef.value.$el.blur()
      } else {
        $event.preventDefault()
      }
    }

    /**
     * Port blur event handler.
     *
     * @param portId - ID of the port blurred
     */
    function onPortBlur (portId: string) {
      if (store.activePortId === portId) {
        store.setActivePortId(null)
      }
    }

    /**
     * Item resize event handler. This will inform the store of the new size of the item.
     */
    function onResize (rect: DOMRect) {
      store.setItemSize({
        id: props.id,
        rect
      })
    }

    return {
      item,
      itemRef,
      store,
      ports,
      viewport,
      isPropertiesEnabled,
      focus,
      onDrag,
      onDragStart,
      onEscapeKey,
      onResize,
      onPortBlur,
      ItemSubtype,
      ItemType
    }
  }
})
</script>
