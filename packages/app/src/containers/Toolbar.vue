<template>
  <div class="toolbar">
    <toolbar-button @click="rotate(-1)" :disabled="!hasSelectedItems">Rotate 90&deg; CCW</toolbar-button>
    <toolbar-button @click="rotate(1)" :disabled="!hasSelectedItems">Rotate 90&deg; CW</toolbar-button><br />
    <toolbar-button @click="group" :disabled="!canGroup">Group</toolbar-button>
    <toolbar-button @click="ungroup" :disabled="!canUngroup">Ungroup</toolbar-button>
    <toolbar-button @click="addLogicGate">Add NOR</toolbar-button>
    <toolbar-button @click="addLightbulb">Add lightbulb</toolbar-button>
    <toolbar-button @click="addSwitch">Add switch</toolbar-button>
    <toolbar-button @click="deleteSelection" :disabled="!hasSelection">Delete selection</toolbar-button>
    <toolbar-button @click="saveIntegratedCircuit">Build IC</toolbar-button>
    <toolbar-button @click="undo" :disabled="!canUndo">Undo</toolbar-button>
    <toolbar-button @click="redo" :disabled="!canRedo">Redo</toolbar-button>
    <toolbar-button @click="bringForward" :disabled="!hasSelectedItems">Bring forward</toolbar-button>
    <toolbar-button @click="sendBackward" :disabled="!hasSelectedItems">Send backward</toolbar-button>
    <toolbar-button @click="sendToBack" :disabled="!hasSelectedItems">Send to back</toolbar-button>
    <toolbar-button @click="bringToFront" :disabled="!hasSelectedItems">Bring to front</toolbar-button>
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { defineComponent } from 'vue'
import ToolbarButton from '../components/toolbar/ToolbarButton.vue'
import ItemSubtype from '../types/enums/ItemSubtype'
import ItemType from '../types/enums/ItemType'
import { mapState } from 'vuex'

const rand = () => `id_${(Math.floor(Math.random() * 10000000000000) + 5)}` // TODO: use uuid

const createPort = (elementId, id, orientation, type, name): Port => ({
  id,
  orientation,
  name,
  position: {
    x: 0,
    y: 0
  },
  type,
  rotation: 0,
  elementId,
  value: 0,
  isFreeport: false,
  connectedPortIds: []
})

export default defineComponent({
  name: 'Toolbar',
  components: {
    ToolbarButton
  },
  computed: {
    ...mapState([
      'selectedConnectionIds',
      'selectedItemIds',
    ]),
    ...mapGetters([
      'hasSelectedItems',
      'hasSelection',
      'canUngroup',
      'canGroup',
      'canUndo',
      'canRedo'
    ])
  },
  methods: {
    addNewItem (id: string, type: ItemType, subtype: ItemSubtype, width: number, height: number, ports: Port[] = []) {
      const item: Item = {
        id,
        name: '',
        type,
        subtype,
        portIds: ports.map(({ id }) => id),
        position: { x: 400, y: 400 },
        rotation: 0,
        isSelected: false,
        boundingBox: {
          left: 400,
          right: 400 + width,
          top: 400,
          bottom: 400 + height
        },
        properties: {},
        groupId: null,
        zIndex: 0,
        width,
        height
      }

      switch (type) {
        case ItemType.LogicGate:
          item.properties = {
            inputCount: {
              label: 'Input count',
              value: 2,
              type: 'number',
              min: 2
            },
            showInOscilloscope: {
              label: 'Show in oscilloscope',
              value: false,
              type: 'boolean'
            }
          }
          break
        case ItemType.InputNode:
          item.properties = {
            name: {
              label: 'Name',
              value: '',
              type: 'text'
            },
            startValue: {
              label: 'Start value',
              value: -1,
              type: 'number',
              options: {
                'True': 1,
                'Hi-Z': 0,
                'False': -1
              }
            },
            showInOscilloscope: {
              label: 'Show in oscilloscope',
              value: true,
              type: 'boolean'
            }
          }
          break
        case ItemType.OutputNode:
          item.properties = {
            name: {
              label: 'Name',
              value: '',
              type: 'text'
            },
            showInOscilloscope: {
              label: 'Show in oscilloscope',
              value: true,
              type: 'boolean'
            }
          }
          break
      }

      this.addItem({ item, ports })
    },

    addLogicGate () {
      const elementId = rand()

      this.addNewItem(elementId, ItemType.LogicGate, ItemSubtype.Nor, 100, 150, [
        createPort(elementId, rand(), 0, 1, 'Input Port 1'),
        createPort(elementId, rand(), 0, 1, 'Input Port 2'),
        createPort(elementId, rand(), 2, 0, 'Output Port')
      ])
    },

    addLightbulb () {
      const elementId = rand()

      this.addNewItem(elementId, ItemType.OutputNode, ItemSubtype.Lightbulb, 40, 40, [
        createPort(elementId, rand(), 0, 1, 'Input Port')
      ])
    },

    addSwitch () {
      const elementId = rand()

      this.addNewItem(elementId, ItemType.InputNode, ItemSubtype.Switch, 40, 40, [
        createPort(elementId, rand(), 2, 0, 'Output Port')
      ])
    },

    ...mapActions([
      'addItem',
      'bringForward',
      'bringToFront',
      'sendBackward',
      'sendToBack',
      'selectAll',
      'deselectAll',
      'deleteSelection',
      'setSelectionState',
      'group',
      'ungroup',
      'setZoom',
      'createSelection',
      'selectConnection',
      'rotate',
      'buildCircuit',
      'saveIntegratedCircuit',
      'undo',
      'redo'
    ])
  }
})
</script>

<style lang="scss">
.toolbar {
  max-height: 100px;
  background-color: salmon;
}
</style>
