<template>
  <div class="documents">
    <div class="documents__debug-info">
        <pre>{{ JSON.stringify(ports, null, 2) }}</pre>
        <!-- <pre>{{ JSON.stringify(elements, null, 2) }}</pre> -->
    </div>
    <div class="documents__container" @contextmenu="contextMenu($event)" @mousewheel="mousewheel" @mousedown.right="startPanning">
      <div :style="style" ref="canvas" class="documents__grid">
        <selector @selectionStart="selectionStart" @selectionEnd="selectionEnd" />

        <wire
          v-for="(connection, key) in connections"
          :key="key"
          :canvas="$refs.canvas"
          :target="connection.source"
          :source="connection.target"
          :is-selected="connection.isSelected"
          @click="selectConnection(key)"
        />

        <group
          v-if="selectedItems.length"
          :items="selectedItems"
          :canvas="$refs.canvas"
          :id="'SELECTION'"
          :position="selection.position"
          :rotation="selectedItems.length === 1 ? selectedItems[0].rotation : selection.rotation"
        />

        <group
          v-for="item in unselectedItems"
          :items="[item]"
          :canvas="$refs.canvas"
          :key="item.id"
          :ref="item.id"
          :id="item.id"
          :position="item.position"
          :rotation="item.rotation"
        />
        <!-- <strong>NON_GROUPS:</strong> -->
      </div>

      <div class="documents__toolbar">
        <input type="checkbox" v-model="snapToGrid.enabled" value="1" /> Snap to grid<br />
        Grid size: <input type="number" v-model.number="snapToGrid.size" /><br />

        <button @click="rotateSelection(-1)">Rotate 90&deg; CCW</button>
        <button @click="rotateSelection(1)">Rotate 90&deg; CW</button><br />
        <button @click="selectAll">Select All</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { defineComponent, nextTick } from 'vue'
import Draggable from './Draggable.vue'
import Port from './Port.vue'
import Wire from './Wire.vue'
import Group from './Group.vue'
import Item from './Item.vue'
import Selector from '../components/Selector.vue'

export default defineComponent({
  name: 'Document',
  components: {
    Draggable,
    Port,
    Wire,
    Group,
    Item,
    Selector
  },
  props: {
    msg: String
  },
  computed: {
    ...mapGetters([
      'zoom',
      'connections',
      'elements',
      'selection',
      'selectedItems',
      'unselectedItems',
      'ports'
    ]),
    style () {
      if (!this.snapToGrid.enabled) return
      return {
        backgroundSize: `${this.snapToGrid.size}px ${this.snapToGrid.size}px`,
        transform: `scale(${this.zoom || 1})`,
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
        x: x - this.offset.left ,
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

    selectionStart () {
      this.deselectAll()
    },

    selectionEnd (selection) {
      const items = this
        .getAllItems()
        .filter((item) => {
          if (!item) return false
          const bbox = item.$el.getBoundingClientRect()

          if (selection.left >= bbox.right || bbox.left >= selection.right) {
            // one rect is on left side of other
            return false
          }

          if (selection.top >= bbox.bottom || bbox.top >= selection.bottom) {
            // one rect is above other
            return false
          }

          return true
        })
        .map(({ $props }) => $props.id)

        console.log('items: ', items)

      this.selectItems(items)
    },

    getAllItems () {
      return Object.values(this.$refs).map((ref: any) => ref[0])
    },

    portDragStart ({ source, target }) {
      this.connect({ source, target })
      // this.activePortType = 'output' // should be 'input' or 'output'
    },

    portDragEnd ({ source, oldTarget, newTarget }) {
      this.disconnect({ source, target: oldTarget })

      if (newTarget) {
        this.connect({ source, target: newTarget })
      }
      this.activePortType = null
    },

    ...mapActions([
      'connect',
      'disconnect',
      'deselectAll',
      'selectAll',
      'setZoom',
      'selectItems',
      'selectConnection',
      'rotateSelection'
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
