<template>
  <div class="documents">
    <div class="documents__debug-info">
      <pre>{{ JSON.stringify(connections, null, 2) }}</pre>
      <pre>{{ JSON.stringify(ports, null, 2) }}</pre>
    </div>

    <div class="documents__panel">
      <div class="documents__toolbar">
        Grid size: <input type="number" v-model.number="gridSize" /><br />

        <button @click="rotate(-1)">Rotate 90&deg; CCW</button>
        <button @click="rotate(1)">Rotate 90&deg; CW</button><br />
        <button @click="group">Group</button>
        <button @click="ungroup">Ungroup</button>
        <button @click="addLogicGate">Add NOR</button>
        <button @click="addLightbulb">Add lightbulb</button>
        <button @click="addSwitch">Add switch</button>
        <button @click="deleteSelection">Delete selection</button>
        <button @click="saveIntegratedCircuit">Build IC</button>

      </div>

      <div class="documents__editor">
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

          <connection
            v-for="connection in connections"
            :id="connection.id"
            :key="connection.id"
            :source="connection.source"
            :target="connection.target"
            :group-id="connection.groupId"
            :connection-chain-id="connection.connectionChainId"
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
        </editor>
      </div>

      <div class="documents__oscilloscope">
        <oscilloscope :waves="waves" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters, mapState } from 'vuex'
import { defineComponent } from 'vue'
import Editor from '../components/Editor.vue'
import Oscilloscope from '../components/Oscilloscope.vue'
import Connection from './Connection.vue'
import Group from './Group.vue'
import Item from './Item.vue'

const rand = () => `id_${(Math.floor(Math.random() * 10000000000000) + 5)}` // TODO: use uuid

const createPort = (elementId, id, orientation, type): Port => ({
  id,
  orientation,
  position: {
    x: 0,
    y: 0
  },
  type,
  rotation: 0,
  elementId,
  value: 0,
  isFreeport: false
})

export default defineComponent({
  name: 'Document',
  components: {
    Editor,
    Oscilloscope,
    Connection,
    Group,
    Item
  },
  computed: {
    ...mapState([
      'groups',
      'snapBoundaries',
      'waves'
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
  mounted () {
    this.$nextTick(() => {
      this.buildCircuit()
    })
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

    addNewItem (id: string, type: string, width: number, height: number, ports: Port[] = []) {
      const item: Item = {
        id,
        type,
        portIds: ports.map(({ id }) => id),
        position: { x: 400, y: 400 },
        rotation: 0,
        isSelected: false,
        properties: {
          inputCount: 1
        },
        boundingBox: {
          left: 400,
          right: 400 + width,
          top: 400,
          bottom: 400 + height
        },
        groupId: null,
        zIndex: 0,
        width,
        height
      }

      this.addItem({ item, ports })
    },

    addLogicGate () {
      const elementId = rand()

      this.addNewItem(elementId, 'LogicGate', 100, 150, [
        createPort(elementId, rand(), 0, 1),
        createPort(elementId, rand(), 0, 1),
        createPort(elementId, rand(), 2, 0)
      ])
    },

    addLightbulb () {
      const elementId = rand()

      this.addNewItem(elementId, 'OutputNode', 40, 40, [
        createPort(elementId, rand(), 0, 1)
      ])
    },

    addSwitch () {
      const elementId = rand()

      this.addNewItem(elementId, 'InputNode', 40, 40, [
        createPort(elementId, rand(), 2, 0)
      ])
    },

    ...mapActions([
      'addItem',
      'connect',
      'disconnect',
      'selectAll',
      'deselectAll',
      'deleteSelection',
      'toggleSelectionState',
      'group',
      'ungroup',
      'setZoom',
      'createSelection',
      'selectConnection',
      'rotate',
      'buildCircuit',
      'saveIntegratedCircuit'
    ])
  }
})
</script>

<style lang="scss">
.documents {
  width: 100vw;
  height: 100vh;
  display: flex;

  &__debug-info {
    width: 15vw;
    height: 100%;
    overflow-y: scroll;
    background-color: #c0c0c0;
  }

  &__panel {
    height: 100%;
    width: 85vw;
    display: flex;
    flex-direction: column;
  }

  &__editor {
    max-width: 100%;
    width: 100%;
    background-color: red;
    overflow: hidden;
    flex: 1;
  }

  &__oscilloscope {
    max-height: 30%;
    height: 200px;
    background-color: green;
  }

  &__toolbar {
    max-height: 100px;
    background-color: salmon;
  }
}
</style>
