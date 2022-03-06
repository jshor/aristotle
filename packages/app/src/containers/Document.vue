<template>
  <div class="documents">
    <div class="documents__debug-info">
      <pre>{{ JSON.stringify(connections, null, 2) }}</pre>
      <pre>{{ JSON.stringify(ports, null, 2) }}</pre>
    </div>

    <div class="documents__panel">
      <toolbar />

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
            :subtype="item.subtype"
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
import Toolbar from './Toolbar.vue'
// import test from './fixtures/basic.json'
import test from './fixtures/flipflop.json'
// import test from './fixtures/ic.json'

export default defineComponent({
  name: 'Document',
  components: {
    Editor,
    Oscilloscope,
    Connection,
    Group,
    Item,
    Toolbar
  },
  computed: {
    ...mapState([
      'groups',
      'snapBoundaries',
      'waves'
    ]),
    ...mapGetters([
      'canUndo',
      'canRedo',
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
      this.loadDocument(JSON.stringify(test))
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
    ...mapActions([
      'addItem',
      'deselectAll',
      'loadDocument',
      'toggleSelectionState',
      'setZoom',
      'createSelection',
      'selectConnection',
      'buildCircuit'
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
