<template>
  <div :style="style" class="grid">
    <selector @selectionStart="selectionStart" @selectionEnd="selectionEnd" />

    <wire
      v-for="(connection, key) in connections"
      :key="key"
      :source="connection.source"
      :target="connection.target"
    />

    <group v-if="selectedItems.length" :items="selectedItems" :id="'SELECTION'" @drag="updatePortPositions" @dragEnd="updateItemPosition" :position="selection.position" :rotation="selection.rotation" @ungroup="deselectAll"
      @portDrag="updatePortPositions" @portDragStart="portDragStart" @portDragEnd="updateItemPosition" @updateProperties="updateProperties" :destroyed="selection.destroyed">
    </group>

    <group v-for="item in unselectedItems" :items="[item]" :key="item.id" :id="item.id" @drag="updatePortPositions" @dragEnd="updateItemPosition" :position="item.position" :rotation="item.rotation"
      @portDrag="updatePortPositions" @portDragStart="portDragStart" @portDragEnd="updateItemPosition" @updateProperties="updateProperties">
      <!-- <item :ports="item.ports" @portDrag="groupDrag" @portDragStart="portDragStart" @portDragEnd="portDragEnd" :activePortType="activePortType">
      </item> -->
    </group>

    <div class="toolbar">
      <input type="checkbox" v-model="snapToGrid.enabled" value="1" /> Snap to grid<br />
      Grid size: <input type="number" v-model.number="snapToGrid.size" /><br />

      <button @click="rotateSelection(-1)">Rotate 90 CCW</button>
      <button @click="rotateSelection(1)">Rotate 90 CW</button>
    </div>

    <pre>{{ JSON.stringify(selection, null, 2) }}</pre>
    <!-- <pre>{{ JSON.stringify(groups, null, 2) }}</pre> -->
    <strong>NON_GROUPS:</strong>
    <!-- <pre>{{ JSON.stringify(fileData.ports, null, 2) }}</pre> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
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
    'deselectAll',
    'updateGroupItemPositions',
    'updateItemPosition',
    'updatePortPositions',
    'updateProperties',
    'rotateSelection'
  ])
})
export default class List extends Vue {
  snapToGrid = {
    enabled: true,
    size: 20
  }

  selectionStart () {
    this.$store.dispatch('destroySelection')
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
      .map(({ $options }) => {
        const { id } = $options?.propsData || {}
        return id
      })

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

  @Getter('documents', 'connections')
  public connections?: any[]

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

  activePortType: any = null

  get style () {
    if (!this.snapToGrid.enabled) return
    return {
      backgroundSize: `${this.snapToGrid.size}px ${this.snapToGrid.size}px`
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

body {
  padding: 0;
  margin: 0;
  overflow: hidden;
  user-select: none;
}

.grid {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-image:
    linear-gradient(to right, #e8e8e8 1px, transparent 1px),
    linear-gradient(to bottom, #e8e8e8 1px, transparent 1px);
}

.toolbar {
  position: relative;
  right: 0;
  z-index: 1000;
  background-color: rgba(0,0,0,0.1);
  width: 300px;
  padding: 1em;
}
</style>
