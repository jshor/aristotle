<template>
  <draggable
    :style="{
      pointerEvents: 'none',
      zIndex
    }"
    :position="item.position"
    :is-selected="isSelected"
    :allow-touch-drag="isSelected"
    @keydown.esc="onEscapeKey"
    @drag="onDrag"
    @drag-start="onDragStart"
    @contextmenu="onContextMenu"
    @dblclick="revealCustomCircuit"
    @touchhold="revealCustomCircuit"
    @drag-end="store.commitCachedState"
    @select="onSelect"
    @deselect="store.setItemSelectionState(id, false)"
    ref="itemRef"
    data-test="item"
    is-focusable
  >
    <properties
      v-if="isPropertiesEnabled"
      v-model="item.properties"
      :id="id"
      :viewport="viewport"
      :bounding-box="item.boundingBox"
      :zoom="store.zoom"
      @pan="store.panDelta"
      aria-label="Properties dialog"
      data-test="properties"
    />
    <circuit-component
      :type="item.type"
      :subtype="item.subtype"
      :name="item.name"
      :ports="ports"
      :properties="item.properties"
      :is-selected="isSelected"
      :flash="flash"
      :style="{
        transform: `rotate(${90 * item.rotation}deg)`
      }"
      @signal="store.setPortValue"
    >
      <template
        v-for="(portList, o) in ports"
        v-slot:[o]
      >
        <port-pivot
          v-for="port in portList"
          :data-port-id="port.id"
          :key="port.id"
        >
          <port-handle
            :id="port.id"
            :hue="port.isMonitored ? port.hue : 0"
            :is-monitored="port.isMonitored"
            :tabindex="0"
            @keydown.esc="onEscapeKey"
            @keydown.space="store.cycleConnectionPreviews(port.id)"
            @keydown.enter="store.commitPreviewedConnection()"
            @contextmenu="store.setActivePortId(port.id)"
            @focus="store.setActivePortId(port.id)"
            @blur="store.unsetActivePortId(port.id)"
          />
        </port-pivot>
      </template>
    </circuit-component>
  </draggable>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, ComponentPublicInstance, watch, onMounted, nextTick } from 'vue'
import CircuitComponent from '@/components/item/CircuitComponent.vue'
import Properties from '@/components/item/Properties.vue'
import PortItem from './PortItem.vue'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import PortHandle from '@/components/port/PortHandle.vue'
import PortPivot from '@/components/port/PortPivot.vue'
import { DocumentStore } from '@/store/document'
import Draggable from '@/components/interactive/Draggable.vue'
import { useRootStore } from '@/store/root'
import Direction from '@/types/enums/Direction'
import Point from '@/types/interfaces/Point'
import Port from '@/types/interfaces/Port'
import ItemProperties from '@/types/interfaces/ItemProperties'

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
    Properties,
    PortHandle,
    PortPivot
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
  setup (props, { emit }) {
    const store = props.store()
    const item = computed(() => store.items[props.id])
    const viewport = computed(() => store.viewport)
    const itemRef = ref<ComponentPublicInstance<HTMLElement>>()

    onMounted(updateSize)

    watch(() => store.items[props.id]?.properties, onUpdateProperties, { deep: true })

    /** A list of all ports that belong to this item. */
    const ports = computed(() => {
      const ports: Record<Direction, Port[]> = {
        [Direction.Left]: [],
        [Direction.Top]: [],
        [Direction.Right]: [],
        [Direction.Bottom]: []
      }

      store
        .items[props.id]
        .portIds
        .forEach(portId => {
          ports[store.ports[portId].orientation].push(store.ports[portId])
        })

      return ports
    })

    /** whether or not the properties trigger button should be visible */
    const isPropertiesEnabled = computed(() => props.isSelected && store.selectedItemIds.size === 1)

    /**
     * Opens the custom circuit (if any) in a new file tab.
     */
    function revealCustomCircuit () {
      if (store.items[props.id].subtype === ItemSubtype.CustomCircuit) {
        useRootStore().openIntegratedCircuit(store.items[props.id])
      }
    }

    function onDragStart () {
      store.cacheState() // cache the undo-able state in case a drag completes
      store.setSnapBoundaries(props.id)
    }

    /**
     * Item drag event handler.
     *
     * @param position - new position that item has moved to
     * @param offset - the drag point w.r.t. the center of the item
     */
    function onDrag (position: Point, offset: Point) {
      store.dragItem(props.id, {
        x: position.x - offset.x - store.items[props.id].width / 2 * store.zoomLevel,
        y: position.y - offset.y - store.items[props.id].height / 2 * store.zoomLevel
      })
    }

    /**
     * Escape keydown event handler.
     * This will blur the element if neither it nor any of its children are focused.
     */
    function onEscapeKey ($event: KeyboardEvent) {
      if (document.activeElement === itemRef.value!.$el) {
        itemRef.value!.$el.blur()
      }

      $event.preventDefault()
    }

    /**
     * Shows the context menu.
     * If the item is not already selected, this will select it.
     */
    function onContextMenu ($event: MouseEvent) {
      if (!props.isSelected) {
        store.setItemSelectionState(props.id, true)
      }

      emit('contextmenu', $event)
    }

    function onSelect (deselectAll?: boolean) {
      if (deselectAll) {
        store.deselectAll()
      }

      store.setItemSelectionState(props.id, true)
    }

    /**
     * Performs update operations on item property values.
     */
    async function onUpdateProperties (properties: ItemProperties) {
      const _item = store.items[props.id]

      await nextTick()

      if (!store.items[props.id]) return

      if (properties.name?.value !== _item.name) {
        store.setItemName(_item, properties.name?.value)
      }

      if (properties.inputCount?.value) {
        store.setInputCount(props.id, properties.inputCount.value)
        await updateSize()
      }

      if (properties.interval && _item.clock) {
        _item.clock.interval = properties.interval.value
      }
    }

    /**
     * Updates the store with the item's DOM size.
     */
    async function updateSize () {
      const element = itemRef.value?.$el

      if (!element) return

      store.setItemSize({
        id: props.id,
        rect: element.getBoundingClientRect()
      })

      await nextTick()

      element
        .querySelectorAll('[data-port-id]')
        .forEach((portElement: HTMLElement) => {
          // ports may have shifted their positions
          const portId = portElement.dataset.portId!
          const { x, y } = portElement.getBoundingClientRect()

          store.setPortRelativePosition({ x, y }, portId)
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
      onSelect,
      onContextMenu,
      revealCustomCircuit,
      ItemSubtype,
      ItemType
    }
  }
})
</script>
