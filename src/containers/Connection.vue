<template>
  <draggable
    v-for="(port, index) in geometries"
    :key="index"
    :position="port.portPosition"
    :style="{ zIndex }"
    @drag-start="p => onDragStart(p, index)"
    @drag="(p, o) => onPortDrag(p, o, index)"
    @drag-end="dragEnd"
    @select="k => selectControlPoint(index, k)"
    @deselect="setControlPointSelectionState(id, index, false)"
    @contextmenu="$e => onControlPointContextMenu($e, index)"
  >
    <port-handle :is-selected="port.isSelected" />
  </draggable>
  <wire-draggable
    v-for="(wire, index) in geometries"
    :key="index"
    :geometry="wire.geometry"
    :ref="wire.ref"
    :source-value="source.value"
    :is-selected="isSelected"
    :style="{
      left: wire.wirePosition.x + 'px',
      top: wire.wirePosition.y + 'px'
    }"
    @add="p => onPortAdd(p, index)"
    @move="p => onNewPortMove(p, index)"
    @added="dragEnd"
    @select="selectConnection"
    @deselect="setConnectionSelectionState(id, false)"
    @contextmenu="onConnectionContextMenu"
  />
  <div
    :style="centroidStyle"
    :tabindex="0"
    @focus="hasFocus = true"
    @blur="hasFocus = false"
  />
  <div
    v-if="hasFocus"
    class="connection__bounding-box"
    :style="boundingBox"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, Ref, ComponentPublicInstance, StyleValue } from 'vue'
import PortHandle from '@/components/port/PortHandle.vue'
import Point from '@/types/interfaces/Point'
import Draggable from '@/components/interactive/Draggable.vue'
import WireGeometry from '@/types/types/WireGeometry'
import renderLayout from '@/store/document/geometry/wire'
import WireDraggable from './WireDraggable.vue'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import ControlPoint from '@/types/interfaces/ControlPoint'
import { DocumentStore } from '@/store/document'

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
    const connection = store.connections[props.id]
    const source = computed(() => store.ports[connection.source])
    const target = computed(() => store.ports[connection.target])
    const hasFocus = ref(false)
    let drag = { x: 0, y: 0 }

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

    const isPreview = computed(() => store.connectionPreviewId === props.id)

    const geometries = computed(() => {
      const { controlPoints } = store.connections[props.id]
      const geometries: {
        geometry: WireGeometry
        wirePosition: Point
        portPosition: Point
        isSelected?: boolean
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
            ? port.orientation
            : (port.orientation + 2) % 4
        })

        geometries.push({
          geometry,
          wirePosition: {
            x: Math.min(previousPort.position.x, port.position.x) + geometry.minX,
            y: Math.min(previousPort.position.y, port.position.y) + geometry.minY
          },
          portPosition: port.position,
          isSelected: port.isSelected,
          ref: ref<ComponentPublicInstance<typeof WireDraggable>>()
        })

        previousPort = port
      }

      return geometries
    })

    const centroidStyle = computed<StyleValue>(() => {
      const a = source.value.position
      const b = target.value.position

      return {
        position: 'absolute',
        left: a.x + (b.x - a.x) / 2,
        top: a.y + (b.y - a.y) / 2
      }
    })

    const boundingBox = computed(() => {
      const g = geometries
        .value
        .reduce((b, { ref }) => {
          const rect = ref.value?.[0]
            ?.$el
            ?.querySelector('path')
            ?.getBoundingClientRect()

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

    function onPortDrag (position: Point, offset: Point, index: number) {
      if (store.connections[props.id].groupId) {
        // connection is in a group; move the group
        store.setSelectionPosition({
          x: position.x - drag.x,
          y: position.y - drag.y
        })

        drag = position
      } else {
        // connection is not in a group; move the control point
        store.dragControlPoint(props.id, position, offset, index)
      }
    }

    function onNewPortMove (position: Point, index: number) {
      onPortDrag(position, { x: 0, y: 0 }, index)
    }

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

      onNewPortMove(position, index)
    }

    function onConnectionContextMenu ($event: MouseEvent) {
      if (!props.isSelected) {
        store.setConnectionSelectionState(props.id, true)
      }

      emit('contextmenu', $event)
    }

    function onControlPointContextMenu ($event: MouseEvent, index: number) {
      if (!store.connections[props.id].controlPoints[index].isSelected) {
        store.setControlPointSelectionState(props.id, index, true)
      }

      emit('contextmenu', $event)
    }

    function selectControlPoint (index: number, deselectAll?: boolean) {
      if (deselectAll && !store.connections[props.id].controlPoints[index].isSelected) {
        store.deselectAll()
      }

      store.setControlPointSelectionState(props.id, index, true)
    }

    function selectConnection (deselectAll?: boolean) {
      if (deselectAll && !props.isSelected) {
        store.deselectAll()
      }

      store.setConnectionSelectionState(props.id, true)
    }

    function dragEnd () {
      store.commitCachedState()
    }

    return {
      isPreview,
      hasFocus,
      source,
      geometries,
      centroidStyle,
      boundingBox,
      onDragStart,
      onPortDrag,
      onPortAdd,
      onNewPortMove,
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
    outline: auto 5px -webkit-focus-ring-color;
    touch-action: none;
    padding: 10px;
    margin-left: -10px;
    margin-top: -10px;
    z-index: 8000;
  }
}
</style>

