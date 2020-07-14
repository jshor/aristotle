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
          :target="connection.source"
          :source="connection.target"
        />

        <group v-if="selectedItems.length" :items="selectedItems" :id="'SELECTION'" @drag="updatePortPositions" @dragEnd="updateItemPosition" :position="selection.position" :rotation="selection.rotation"
          @portDrag="updatePortPositions" @portDragStart="portDragStart" @portDragEnd="updateItemPosition" @updateProperties="updateProperties">
        </group>

        <group v-for="item in unselectedItems" :items="[item]" :key="item.id" :id="item.id" @drag="updatePortPositions" @dragEnd="updateItemPosition" :position="item.position" :rotation="item.rotation"
          @portDrag="updatePortPositions" @portDragStart="portDragStart" @portDragEnd="updateItemPosition" @updateProperties="updateProperties">
          <!-- <item :ports="item.ports" @portDrag="groupDrag" @portDragStart="portDragStart" @portDragEnd="portDragEnd" :activePortType="activePortType">
          </item> -->
        </group>

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
import { Component, Vue, Prop } from 'vue-property-decorator'
import Draggable from './Draggable.vue'
import Port from './Port.vue'
import Wire from './Wire.vue'
import Group from './Group.vue'
import Item from './Item.vue'
import Selector from './Selector.vue'
import { mapActions } from 'vuex'
import { Getter, Action } from '../store/decorators'

@Component({
  components: {
    Draggable,
    Port,
    Wire,
    Group,
    Item,
    Selector
  },
  methods: mapActions([
    'selectAll',
    'deselectAll',
    'updateGroupItemPositions',
    'updateItemPosition',
    'updatePortPositions',
    'updateProperties',
    'rotateSelection'
  ])
})
export default class Canvas extends Vue {
  snapToGrid = {
    enabled: true,
    size: 20
  }

  offset = {
    left: 0,
    top: 0
  }

  panning: boolean = false

  panStartPosition = {
    x: 0,
    y: 0
  }

  startPanning ({ x, y }) {
    this.panning = true
    this.panStartPosition = {
      x: x - this.offset.left ,
      y: y - this.offset.top
    }
  }

  mousemove ({ x, y }) {
    if (this.panning) {
      this.offset = {
        left: Math.min(x - this.panStartPosition.x, 0),
        top: Math.min(y - this.panStartPosition.y, 0)
      }
    }
  }

  mounted () {
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  }

  destroy () {
    window.removeEventListener('mousemove', this.mousemove)
    window.removeEventListener('mouseup', this.mouseup)
  }

  preventContextMenu: boolean = false

  mouseup (e) {
    if (e.button === 2 && (this.panStartPosition.x !== e.x || this.panStartPosition.y!== e.y)) {
      this.preventContextMenu = true
    }
    this.panning = false
    this.panStartPosition = { x: 0, y: 0 }
  }

  contextMenu (e) {
    if (this.preventContextMenu) {
      this.preventContextMenu = false
      e.preventDefault()
    }
  }

  fromDocumentToEditorCoordinates (point) {
    const viewer = (this.$refs.canvas as any).getBoundingClientRect()

    return {
      x: (point.x - viewer.x) / this.zoom,
      y: (point.y - viewer.y) / this.zoom
    }
  }

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

    this.$store.dispatch('setZoom', newZoom)
  }

  selectionStart () {
    this.$store.dispatch('deselectAll')
  }

  selectionEnd (selection) {
    const { left, top, right, bottom } = selection

    const items = this
      .getAllItems(this)
      .filter((item) => {
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
      .map(({ $options }) => $options?.propsData?.id)

    this.$store.dispatch('selectItems', items)
  }


  getAllItems (component: any, items: any[] = []) {
    return [
      ...items,
      ...component.$children.filter((child: any) => child instanceof Item),
      ...component.$children.reduce((children: any[], child: any) => {
        return this.getAllItems(child, children)
      }, [])
    ]
  }

  @Getter('documents', 'zoom')
  public zoom: number

  @Getter('documents', 'connections')
  public connections?: any[]

  @Getter('documents', 'elements')
  public elements?: any

  @Getter('documents', 'selection')
  public selection?: any

  @Getter('documents', 'selectedItems')
  public selectedItems?: any[]

  @Getter('documents', 'unselectedItems')
  public unselectedItems?: any[]

  @Action('documents', 'connect')
  public connect: Function

  @Action('documents', 'disconnect')
  public disconnect: Function

  @Getter('documents', 'ports')
  public ports: any[]

  activePortType: any = null

  get style () {
    if (!this.snapToGrid.enabled) return
    return {
      backgroundSize: `${this.snapToGrid.size}px ${this.snapToGrid.size}px`,
      transform: `scale(${this.zoom || 1})`,
      left: `${this.offset.left}px`,
      top: `${this.offset.top}px`
    }
  }

  portDragStart ({ source, target }) {
    this.connect({ source, target })
    this.activePortType = 'output' // should be 'input' or 'output'
  }

  portDragEnd ({ source, oldTarget, newTarget }) {
    this.disconnect({ source, target: oldTarget })

    if (newTarget) {
      this.connect({ source, target: newTarget })
    }
    this.activePortType = null

    // delete this.fileData.ports['DRAGGED_PORT']
  }

  rotation: number = 0

  connectPrompt: any = {
    source: 'c',
    target: 'd'
  }
}
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
