<template>
  <!-- the tab-accessible centroid element -->
  <div
    :style="centroidStyle"
    :tabindex="0"
    :aria-label="title"
    data-test="centroid"
    @focus="onConnectionFocus"
    @blur="hasFocus = false"
  />

  <!-- each segment of the visible wire -->
  <!-- TODO: set is-animated according to preferences -->
  <wire-draggable
    v-for="(wire, index) in geometries"
    :key="index"
    :geometry="wire.geometry"
    :ref="wire.ref"
    :source-value="source.value"
    :is-selected="isSelected"
    :is-animated="colors.animate.value"
    :style="{
      left: wire.wirePosition.x + 'px',
      top: wire.wirePosition.y + 'px'
    }"
    :title="title"
    :flash="flash"
    :label="title"
    @add="p => onPortAdd(p, index)"
    @move="p => onPortDrag(p, index)"
    @added="dragEnd"
    @select="selectConnection"
    @deselect="setConnectionSelectionState(id, false)"
    @contextmenu="onConnectionContextMenu"
  />

  <!-- the visual outline of the bounding box surrounding the connection -->
  <div
    v-if="hasFocus"
    data-test="bounding-box"
    class="connection__bounding-box"
    :style="boundingBox"
  />

  <!-- the control points -->
  <!-- render only n-1 control points, since the last one is the target port -->
  <draggable
    v-for="(port, index) in geometries.slice(0, geometries.length - 1)"
    :key="index"
    :position="port.portPosition"
    :style="{ zIndex }"
    :is-selected="port.isSelected"
    :allow-touch-drag="port.isSelected"
    @drag-start="p => onDragStart(p, index)"
    @drag="p => onPortDrag(p, index)"
    @drag-end="dragEnd"
    @select="k => selectControlPoint(index, k)"
    @deselect="setControlPointSelectionState(id, index, false)"
    @contextmenu="$e => onControlPointContextMenu($e, index)"
  >
    <div class="connection__port" />
    <port-handle :is-selected="port.isSelected" />
  </draggable>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, Ref, ComponentPublicInstance, StyleValue } from 'vue'
import { useI18n } from 'vue-i18n'
import PortHandle from '@/components/port/PortHandle.vue'
import Point from '@/types/interfaces/Point'
import Draggable from '@/components/interactive/Draggable.vue'
import WireDraggable from '@/components/basic/WireDraggable.vue'
import WireGeometry from '@/types/types/WireGeometry'
import renderLayout from '@/store/document/geometry/wire'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import ControlPoint from '@/types/interfaces/ControlPoint'
import { DocumentStore } from '@/store/document'
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '@/store/preferences'

export default defineComponent({
  name: 'Connection',
  components: {
    Draggable,
    WireDraggable,
    PortHandle
  },
  props: {
    /** Whether or not this connection is selected. */
    isSelected: {
      type: Boolean,
      default: false
    },

    /** ID of the connection. */
    id: {
      type: String,
      required: true
    },

    /** CSS z-index value. */
    zIndex: {
      type: Number,
      default: 0
    },

    /** Whether or not the connection should show a flash once to the user. */
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
    const { t } = useI18n()
    const store = props.store()
    const { colors } = storeToRefs(usePreferencesStore())
    const connection = store.connections[props.id]
    const source = computed(() => store.ports[connection.source])
    const target = computed(() => store.ports[connection.target])
    const hasFocus = ref(false)

    let drag = { x: 0, y: 0 }

    /** Returns a new control point. */
    const createControlPoint = (data: Partial<ControlPoint> = {}): ControlPoint => ({
      position: {
        x: 0,
        y: 0
      },
      orientation: 0,
      rotation: 0,
      canInflect: true,
      ...data
    })

    /** Whether or not this connection was established as a preview. */
    const isPreview = computed(() => store.connectionPreviewId === props.id)

    /** The user-friendly title for the connection. */
    const title = computed(() => {
      const source = store.ports[connection.source]
      const target = store.ports[connection.target]

      return t('label.connectionFrom', [source.name, target.name])
    })

    /**
     * List of *n* wire geometries.
     * Each wire geometry is a segment of the connection, including its target connection point.
     * Only *n* - 1 control points should be rendered, since the last one is the target port.
     */
    const geometries = computed(() => {
      const { controlPoints } = store.connections[props.id]
      const geometries: {
        geometry: WireGeometry
        wirePosition: Point
        portPosition: Point
        isSelected: boolean
        ref: Ref<ComponentPublicInstance<typeof WireDraggable> | undefined>
      }[] = []
      let previousPort = createControlPoint({ ...source.value, canInflect: false })

      for (let i = 0; i <= controlPoints.length; i++) {
        const port = i === controlPoints.length
          ? createControlPoint({ ...target.value, canInflect: false })
          : controlPoints[i]

        const geometry = renderLayout(previousPort, {
          ...port,
          orientation: i === controlPoints.length
            // the last wire segment should have the same orientation as the target port
            ? port.orientation
            // all other wire segments should be rotated 180 degrees to accommodate their control points
            : (port.orientation + 2) % 4
        })

        geometries.push({
          geometry,
          wirePosition: {
            x: Math.min(previousPort.position.x, port.position.x) + geometry.minX,
            y: Math.min(previousPort.position.y, port.position.y) + geometry.minY
          },
          portPosition: port.position,
          isSelected: port.isSelected!,
          ref: ref<ComponentPublicInstance<typeof WireDraggable>>()
        })

        previousPort = port
      }

      return geometries
    })

    /** The invisible centroid div style, used for maintaining `tabindex`. */
    const centroidStyle = computed<StyleValue>(() => {
      const a = source.value.position
      const b = target.value.position

      return {
        position: 'absolute',
        left: a.x + (b.x - a.x) / 2,
        top: a.y + (b.y - a.y) / 2
      }
    })

    /** The bounding box outline of the entire connection, displayed for accessibility. */
    const boundingBox = computed(() => {
      const g = geometries
        .value
        .reduce((b, { ref }) => {
          const rect = ref.value?.[0]
            .$el
            .querySelector('path')
            .getBoundingClientRect()

          if (!rect) {
            return b
          }

          return {
            top: Math.min(b.top, rect.top),
            left: Math.min(b.left, rect.left),
            bottom: Math.max(b.bottom, rect.bottom),
            right: Math.max(b.right, rect.right)
          }
        }, {
          top: Infinity,
          left: Infinity,
          bottom: -Infinity,
          right: -Infinity
        })

      const { x, y } = fromDocumentToEditorCoordinates(store.canvas, store.viewport, {
        x: g.left,
        y: g.top
      }, store.zoom)

      return {
        left: `${x}px`,
        top: `${y}px`,
        width: `${(g.right - g.left) / store.zoom}px`,
        height: `${(g.bottom - g.top) / store.zoom}px`
      }
    })

    /**
     * Drag start handler for control points and wires.
     */
    function onDragStart (position: Point, index: number) {
      store.cacheState()

      if (store.connections[props.id].groupId) {
        // connection is in a group; keep track of the drag position
        drag = position
      } else {
        // connection is not in a group; set the snap boundaries
        store.setControlPointSnapBoundaries(props.id, geometries.value, index)
      }
    }

    /**
     * Handles movement of the given control point.
     */
    function onPortDrag (position: Point, index: number) {
      if (store.connections[props.id].groupId) {
        // connection is in a group; move the group
        store.setSelectionPosition({
          x: (position.x - drag.x) / store.zoomLevel,
          y: (position.y - drag.y) / store.zoomLevel
        })

        drag = position
      } else {
        // connection is not in a group; move the control point
        store.dragControlPoint(props.id, position, index)
      }
    }

    /**
     * Adds an *n*th control point to the connection at the specified position.
     */
    function onPortAdd (position: Point, index: number) {
      store.cacheState()

      if (store.connections[props.id].groupId) {
        // connection is in a group; keep track of the drag position
        drag = position
      } else {
        // connection is not in a group; add a new control point
        store.deselectAll()
        store.setControlPointSnapBoundaries(props.id, geometries.value, -1)
        store.addControlPoint(props.id, position, index)
      }

      onPortDrag(position, index)
    }

    /**
     * Draggable wire context menu handler.
     * This will select the entire connection (including its control points) if not already selected.
     */
    function onConnectionContextMenu ($event: MouseEvent) {
      if (!props.isSelected) {
        store.setConnectionSelectionState(props.id, true)
      }

      emit('contextmenu', $event)
    }

    /**
     * Control point context menu handler.
     * This will select the control point if it is not already selected.
     */
    function onControlPointContextMenu ($event: MouseEvent, index: number) {
      if (!store.connections[props.id].controlPoints[index].isSelected) {
        selectControlPoint(index)
      }

      emit('contextmenu', $event)
    }

    /**
     * Selects the control point of the given index in the store.
     */
    function selectControlPoint (index: number, deselectAll?: boolean) {
      if (deselectAll) {
        store.deselectAll()
      }

      store.setControlPointSelectionState(props.id, index, true)
    }

    /**
     * Selects the connection in the store.
     */
    function selectConnection (deselectAll?: boolean) {
      if (deselectAll) {
        store.deselectAll()
      }

      store.setConnectionSelectionState(props.id, true)
    }

    /**
     * Selects the connection visually (bounding box) and in the store.
     */
    function onConnectionFocus () {
      hasFocus.value = true
      selectConnection(true)
    }

    /**
     * Commits the cached state.
     */
    function dragEnd () {
      store.commitCachedState()
    }

    return {
      colors,
      title,
      isPreview,
      hasFocus,
      source,
      geometries,
      centroidStyle,
      boundingBox,
      onDragStart,
      onPortDrag,
      onPortAdd,
      onConnectionFocus,
      onConnectionContextMenu,
      onControlPointContextMenu,
      dragEnd,
      selectControlPoint,
      selectConnection,
      cacheState: store.cacheState,
      setConnectionSelectionState: store.setConnectionSelectionState,
      setControlPointSelectionState: store.setControlPointSelectionState
    }
  }
})
</script>

<style lang="scss">
.connection {
  &__bounding-box {
    position: absolute;
    border: 1px solid var(--color-primary);
    border-radius: 4px;
    pointer-events: none;
    outline: auto $outline-border-width -webkit-focus-ring-color;
    touch-action: none;
    padding: 10px;
    margin-left: -10px;
    margin-top: -10px;
    z-index: 8000;
  }

  &__port {
    border-radius: 50%;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: block;
    margin-left: -16px;
    margin-top: -16px;
  }
}
</style>

