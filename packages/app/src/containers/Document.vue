<template>
  <div class="documents">
    <div class="documents__panel">
      <toolbar />

      <div class="documents__editor">
        <editor
          ref="editor"
          :zoom="zoom"
          :grid-size="gridSize"
          :tabindex="0"
          @deselect="deselectAll"
          @selection="createSelection"
          @zoom="setZoom"
        >
          <template v-for="baseItem in baseItems">
            <item
              v-if="baseItem.type"
              :id="baseItem.id"
              :key="baseItem.id"
              :ports="baseItem.ports"
              :type="baseItem.type"
              :subtype="baseItem.subtype"
              :name="baseItem.name"
              :position="baseItem.position"
              :rotation="baseItem.rotation"
              :group-id="baseItem.groupId"
              :bounding-box="baseItem.boundingBox"
              :properties="baseItem.properties"
              :is-selected="baseItem.isSelected"
              :z-index="baseItem.zIndex + 1000"
              @select="selectItem(baseItem.id)"
              @deselect="deselectItem(baseItem.id)"
              @blur="onItemBlur"
            />
            <!-- Note: z-index of items will be offset by +1000 to ensure it always overlaps wires -->

            <connection
              v-else
              :id="baseItem.id"
              :key="baseItem.id"
              :source="ports[baseItem.source]"
              :target="ports[baseItem.target]"
              :group-id="baseItem.groupId"
              :connection-chain-id="baseItem.connectionChainId"
              :is-selected="baseItem.isSelected"
              :z-index="baseItem.zIndex"
              @select="selectItem(baseItem.id)"
              @deselect="deselectItem(baseItem.id)"
              @blur="onItemBlur"
            />
          </template>

          <group
            v-for="group in groups"
            :key="group.id"
            :id="group.id"
            :bounding-box="group.boundingBox"
            :is-selected="group.isSelected"
            :z-index="zIndex"
          />

        </editor>
      </div>

      <div class="documents__oscilloscope">
        <oscilloscope :waves="waves" :tabindex="-1" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from 'pinia'
import { defineComponent } from 'vue'
import { useDocumentStore } from '../store/document'
import Editor from '../components/Editor.vue'
import Oscilloscope from '../components/Oscilloscope.vue'
import Connection from './Connection.vue'
import Group from './Group.vue'
import Item from './Item.vue'
import Toolbar from './Toolbar.vue'
// import test from './fixtures/basic.json'
import test from './fixtures/flipflop.json'
import { Vue } from 'vue-property-decorator'
// import test from './fixtures/ic.json'
import sortByZIndex from '../utils/sortByZIndex'

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
    ...mapState(useDocumentStore, [
      'activePortId',
      'connections',
      'groups',
      'ports',
      'snapBoundaries',
      'waves',
      'zIndex',
      'canUndo',
      'canRedo',
      // 'items',
      'zoom'
    ]),
    ...mapState(useDocumentStore, {
      items: 'trueItems'
    }),

    baseItems () {
      const baseItems = Object
        .values(this['connections'] as any)
        .concat(Object.values(this['items'] as any))

      return (baseItems as BaseItem[]).sort(sortByZIndex)
    }
  },
  data () {
    return {
      gridSize: 20,
      acceleration: 1,
      lastFocusedElement: null as HTMLElement | null,
      keys: {} as Record<string, boolean>
    }
  },
  mounted () {
    this.buildCircuit()
    this.loadDocument(JSON.stringify(test))

    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.clearKeys)
  },
  beforeDestroy () {
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.clearKeys)
  },
  methods: {
    ...mapActions(useDocumentStore, [
      'clearActivePortId',
      'deselectAll',
      'loadDocument',
      'setSelectionState',
      'setZoom',
      'createSelection',
      'moveSelectionPosition',
      'buildCircuit'
    ]),

    onKeyDown ($event: KeyboardEvent) {
      this.keys[$event.key] = true
      this.moveItemsByArrowKey($event)

      if (this.lastFocusedElement && $event.key === 'Tab') {
        this.lastFocusedElement.focus()
        this.lastFocusedElement = null
        $event.preventDefault()
      }

      if ($event.key === 'Escape') {
        this.deselectAll()
      }
    },

    onKeyUp ($event: KeyboardEvent) {
      this.keys[$event.key] = false
      this.acceleration = 1
    },

    onItemBlur ($event: FocusEvent) {
      if (!(this.$refs.editor as Vue).$el.contains($event.relatedTarget as Node) || !$event.relatedTarget) {
        this.lastFocusedElement = $event.currentTarget as HTMLElement
      }
    },

    moveItemsByArrowKey ($event: KeyboardEvent) {
      const delta = (() => {
        switch ($event.key) {
          case 'ArrowLeft':
            return { x: -1, y: 0 }
          case 'ArrowUp':
            return { x: 0, y: -1 }
          case 'ArrowRight':
            return { x: 1, y: 0 }
          case 'ArrowDown':
            return { x: 0, y: 1 }
        }
      })()

      if (delta) {
        const i = Math.min(this.acceleration, 10)

        this.moveSelectionPosition({
          x: delta.x * i,
          y: delta.y * i
        })
        this.acceleration *= 1.05
      }
    },

    clearKeys () {
      this.keys = {}
    },

    /**
     * Selects an item having the given id (`Item` or `Connection`).
     * If the shift key is not held down, then any existing selection is cleared.
     */
    selectItem (id: string) {
      if (!this.keys.Control) { // TODO: command too (for mac?)
        this.deselectAll()
      }

      this.clearActivePortId()
      this.setSelectionState({ id, value: true })
    },

    deselectItem (id: string) {
      if (!this.keys.Control) { // TODO: command too (for mac?)
        this.setSelectionState({ id, value: false })
      }
    }
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
    width: 100vw;
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
