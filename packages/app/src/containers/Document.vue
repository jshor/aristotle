<template>
  <div class="documents">
    <div class="documents__debug-info">
      <pre>{{ JSON.stringify(ports, null, 2) }}</pre>
    </div>

    <editor
      :zoom="zoom"
      :grid-size="gridSize"
      @deselect="deselectAll"
      @selection="createSelection"
      @zoom="setZoom"
    >
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
    </editor>

    <div class="documents__toolbar">
      Grid size: <input type="number" v-model.number="gridSize" /><br />

      <button @click="rotate(-1)">Rotate 90&deg; CCW</button>
      <button @click="rotate(1)">Rotate 90&deg; CW</button><br />
      <button @click="group">Group</button>
      <button @click="ungroup">Ungroup</button>
      <button @click="addNewItem">Add item</button>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters, mapState } from 'vuex'
import { defineComponent } from 'vue'
import BoundingBox from '../components/BoundingBox.vue'
import Editor from '../components/Editor.vue'
import Wire from './Wire.vue'
import Group from './Group.vue'
import Item from './Item.vue'

export default defineComponent({
  name: 'Document',
  components: {
    BoundingBox,
    Editor,
    Wire,
    Group,
    Item
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
    ])
  },
  data () {
    return {
      gridSize: 20
    }
  },
  methods: {
    /**
     * Selects an item having the given id (`Item` or `Connection`).
     * If the shift key is not held down, then any existing selection is cleared.
     */
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
      const inputPortId2 = rand()
      const item = {
        id: rand(),
        type: 'Item',
        portIds: [inputPortId, inputPortId2, outputPortId],
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
        createPort(inputPortId, 0, 1),
        createPort(inputPortId2, 0, 1),
        createPort(outputPortId, 2, 0)
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
