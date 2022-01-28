<template>
  <div class="documents">
    <div class="documents__debug-info">
        <pre>{{ JSON.stringify(ports, null, 2) }}</pre>
        <!-- <pre>{{ JSON.stringify(items, null, 2) }}</pre> -->
    </div>
    <div class="documents__container" @contextmenu="contextMenu($event)" @mousewheel="mousewheel" @mousedown.right="startPanning">
      <div :style="style" ref="canvas" class="documents__grid">
        <selector
          :zoom="zoom"
          @selection-start="selectionStart"
          @selection-end="selectionEnd"
        />

        <group
          v-for="group in groups"
          :key="group.id"
          :id="group.id"
          :bounding-box="group.boundingBox"
          :is-selected="group.isSelected"
          :z-index="group.zIndex"
        />

        <wire
          v-for="connection in connections"
          :id="connection.id"
          :key="connection.id"
          :target="connection.source"
          :source="connection.target"
          :group-id="connection.groupId"
          :is-selected="connection.isSelected"
          :z-index="connection.zIndex"
          @select="$e => selectItem($e, connection.id)"
        />

        <item
          v-for="item in items"
          :id="item.id"
          :key="item.id"
          :ports="item.ports"
          :type="item.type"
          :position="item.position"
          :rotation="item.rotation"
          :group-id="item.groupId"
          :bounding-box="item.boundingBox"
          :properties="item.properties"
          :is-selected="item.isSelected"
          @select="$e => selectItem($e, item.id)"
        />

        <bounding-box
          v-for="item in items"
          :key="item.id"
          :x="item.boundingBox?.left"
          :y="item.boundingBox?.top"
          :width="item.boundingBox?.right - item.boundingBox?.left"
          :height="item.boundingBox?.bottom - item.boundingBox?.top"
        />

        <!-- <strong>NON_GROUPS:</strong> -->
      </div>

      <div class="documents__toolbar">
        <input type="checkbox" v-model="snapToGrid.enabled" value="1" /> Snap to grid<br />
        Grid size: <input type="number" v-model.number="snapToGrid.size" /><br />

        <button @click="rotate(-1)">Rotate 90&deg; CCW</button>
        <button @click="rotate(1)">Rotate 90&deg; CW</button><br />
        <button @click="group">Group</button>
        <button @click="ungroup">Ungroup</button>
        <button @click="addNewItem">Add item</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { defineComponent } from 'vue'
import Draggable from './Draggable.vue'
import Wire from './Wire.vue'
import Group from './Group.vue'
import Item from './Item.vue'
import Selector from '../components/Selector.vue'
import BoundingBox from '../components/BoundingBox.vue'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'Document',
  components: {
    Draggable,
    Wire,
    Group,
    Item,
    Selector,
    BoundingBox
  },
  props: {
    msg: String
  },
  computed: {
    ...mapState([
      'groups',
      'snapBoundaries'
    ]),
    ...mapGetters([
      'items',
      'zoom',
      'connections',
      'ports'
    ]),
    style () {
      if (!this.snapToGrid.enabled) return
      return {
        backgroundSize: `${this.snapToGrid.size}px ${this.snapToGrid.size}px`,
        transform: `scale(${this.zoom})`,
        left: `${this.offset.left}px`,
        top: `${this.offset.top}px`
      }
    }
  },
  data () {
    return {
      offset: {
        left: 0,
        top: 0
      },
      panStartPosition: {
        x: 0,
        y: 0
      },
      panning: false,
      preventContextMenu: false,
      activePortType: null,
      rotation: 0,
      connectPrompt: {
        source: 'c',
        target: 'd'
      },
      snapToGrid: {
        enabled: true,
        size: 20
      },
      isCanvas: true
    }
  },
  mounted () {
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  },
  destroy () {
    window.removeEventListener('mousemove', this.mousemove)
    window.removeEventListener('mouseup', this.mouseup)
  },
  methods: {
    startPanning ({ x, y }) {
      this.panning = true
      this.panStartPosition = {
        x: x - this.offset.left,
        y: y - this.offset.top
      }
    },

    mousemove ({ x, y }) {
      if (this.panning) {
        this.offset = {
          left: Math.min(x - this.panStartPosition.x, 0),
          top: Math.min(y - this.panStartPosition.y, 0)
        }
      }
    },

    mouseup (e) {
      if (e.button === 2 && (this.panStartPosition.x !== e.x || this.panStartPosition.y!== e.y)) {
        this.preventContextMenu = true
      }
      this.panning = false
      this.panStartPosition = { x: 0, y: 0 }
    },

    contextMenu (e) {
      if (this.preventContextMenu) {
        this.preventContextMenu = false
        e.preventDefault()
      }
    },

    fromDocumentToEditorCoordinates (point) {
      const viewer = (this.$refs.canvas as any).getBoundingClientRect()

      return {
        x: (point.x - viewer.x) / this.zoom,
        y: (point.y - viewer.y) / this.zoom
      }
    },

    mousewheel (args) {
      if (!args.shiftKey) return

      const newZoom = this.zoom + (args.deltaY / 1000)
      const point = this.fromDocumentToEditorCoordinates({
        x: args.x,
        y: args.y
      })
      const scaledPoint = {
        x: point.x * newZoom,
        y: point.y * newZoom
      }

      this.offset = {
        left: Math.min(point.x - scaledPoint.x, 0),
        top: Math.min(point.y - scaledPoint.y, 0)
      }

      this.setZoom(newZoom)
    },

    selectionStart ($event) {
      if (!$event.shiftKey) {
        this.deselectAll()
      }
    },

    selectionEnd (rect: DOMRect) {
      const point = this.fromDocumentToEditorCoordinates({
        x: rect.x,
        y: rect.y
      })

      this.createSelection({
        left: point.x,
        top: point.y,
        right: point.x + rect.width,
        bottom: point.y + rect.height
      })
    },

    selectItem ($event: MouseEvent, id: string) {
      if (!$event.shiftKey) {
        this.deselectAll()
      }

      this.toggleSelectionState({ id })
    },

    addNewItem () {
      const rand = () => `id_${(Math.floor(Math.random() * 100) + 5)}` // TODO: use uuid

      const outputPortId = rand()
      const inputPortId = rand()
      const item = {
        id: rand(),
        type: 'Item',
        portIds: [outputPortId, inputPortId],
        position: { x: 400, y: 400 },
        rotation: 0,
        isSelected: false,
        properties: {
          inputCount: 1
        },
        boundingBox: {
          left: 400,
          right: 500,
          top: 400,
          bottom: 550
        },
        groupId: null,
        zIndex: 0,
        width: 100,
        height: 150
      }
      const createPort = (id, orientation, type) => ({
        id,
        orientation,
        position: {
          x: 0,
          y: 0
        },
        type,
        rotation: 0,
        isFreeport: false
      })
      const ports = [
        createPort(outputPortId, 0, 0),
        createPort(inputPortId, 2, 1)
      ]

      this.addItem({ item, ports })
    },

    ...mapActions([
      'addItem',
      'connect',
      'disconnect',
      'selectAll',
      'deselectAll',
      'toggleSelectionState',
      'group',
      'ungroup',
      'setZoom',
      'createSelection',
      'selectConnection',
      'rotate'
    ])
  }
})
</script>

<style lang="scss">
.documents {
  width: 100%;
  height: 100%;
  display: flex;

  &__debug-info {
    width: 300px;
    height: 100%;
    overflow-y: scroll;
    background-color: #c0c0c0;
  }

  &__grid {
    position: relative;
    box-sizing: border-box;
    width: 300vw;
    height: 300vh;
    background-image:
      linear-gradient(to right, #c0c0c0 1px, transparent 1px),
      linear-gradient(to bottom, #c0c0c0 1px, transparent 1px);
    background-color: #e8e8e8;
    transform-origin: top left;
  }

  &__container {
    overflow: hidden;
    flex: 1;
    height: 100%;
  }

  &__toolbar {
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1000;
    background-color: rgba(0,0,0,0.8);
    color: #fff;
    width: 300px;
    padding: 1em;
  }
}
</style>
