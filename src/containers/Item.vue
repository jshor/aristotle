<template>
  <draggable
    :style="{
      outline: 'none',
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
        <port-item
          v-for="port in portList"
          :tabindex="0"
          :store="$props.store"
          :id="port.id"
          :key="`${port.id}_${portUpdates}`"
          :title="port.name"
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
import { defineComponent, PropType, ref, computed, ComponentPublicInstance, watch, onMounted } from 'vue'
import CircuitComponent from '@/components/item/CircuitComponent.vue'
import Properties from '@/components/item/Properties.vue'
import PortItem from './PortItem.vue'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import { DocumentStore } from '@/store/document'
import Draggable from '@/components/interactive/Draggable.vue'
import { useRootStore } from '@/store/root'
import editorContextMenu from '@/menus/context/editor'
import Direction from '@/types/enums/Direction'

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
    const portUpdates = ref(0)

    // watch for any updates that cause the ports to move their position (relative to the item)
    watch(() => store.items[props.id]?.rotation, () => portUpdates.value++)
    watch(() => store.items[props.id]?.properties.inputCount?.value, () => {
      updateSize()
      portUpdates.value++
    })

    onMounted(updateSize)

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

    /* whether or not the properties trigger button should be visible */
    const isPropertiesEnabled = computed(() => {
      return props.isSelected && store.selectedItemIds.length === 1 && store.items[props.id].type !== ItemType.Freeport
    })

    /**
     * Places the window focus on the item element.
     */
    function focus () {
      itemRef.value!.$el.focus()
    }

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
     * This will cache the undo-able state if dragged for the first time.
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
      } else {
        $event.preventDefault()
      }
    }

    /**
     * Port blur event handler.
     */
    function onPortBlur (portId: string) {
      if (store.activePortId === portId) {
        store.setActivePortId(null)
      }
    }

    /**
     * Shows the context menu.
     * If the item is not already selected, this will select it.
     */
    function onContextMenu () {
      if (!props.isSelected) {
        store.selectItem(props.id)
      }

      window.api.showContextMenu(editorContextMenu(props.store))
    }

    /**
     * Updates the store with the item's DOM size.
     */
    function updateSize () {
      store.setItemSize({
        id: props.id,
        rect: itemRef.value?.$el.getBoundingClientRect()!
      })
    }

    return {
      item,
      itemRef,
      store,
      ports,
      viewport,
      isPropertiesEnabled,
      portUpdates,
      focus,
      onDrag,
      onDragStart,
      onEscapeKey,
      onPortBlur,
      onContextMenu,
      revealCustomCircuit,
      ItemSubtype,
      ItemType
    }
  }
})
</script>
