<template>
  <div class="toolbar">
    <button @click="rotate(-1)" :disabled="!canRotate">Rotate 90&deg; CCW</button>
    <button @click="rotate(1)" :disabled="!canRotate">Rotate 90&deg; CW</button><br />
    <button @click="group" :disabled="selectionCount <= 1">Group</button>
    <button @click="ungroup" :disabled="selectedGroupsCount === 0">Ungroup</button>
    <button @click="addLogicGate">Add NOR</button>
    <button @click="addLightbulb">Add lightbulb</button>
    <button @click="addSwitch">Add switch</button>
    <button @click="deleteSelection" :disabled="selectionCount === 0">Delete selection</button>
    <button @click="saveIntegratedCircuit">Build IC</button>
    <button @click="undo" :disabled="!canUndo">Undo</button>
    <button @click="redo" :disabled="!canRedo">Redo</button>
  </div>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { defineComponent } from 'vue'

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
  name: 'Toolbar',
  computed: {
    ...mapGetters([
      'canUndo',
      'canRedo',
      'selectedItemsData',
      'selectedConnectionsCount',
      'selectedGroupsCount'
    ]),
    selectionCount (): number {
      return this.selectedItemsData.count
        + this.selectedConnectionsCount
        + this.selectedGroupsCount
    },
    canRotate (): boolean {
      return (this.selectedItemsData.count + this.selectedGroupsCount) > 0
    }
  },
  methods: {
    addNewItem (id: string, type: string, width: number, height: number, ports: Port[] = []) {
      const item: Item = {
        id,
        type,
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
        groupId: null,
        zIndex: 0,
        width,
        height
      }

      switch (type) {
        case 'LogicGate':
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
        case 'Switch':
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
        case 'Lightbulb':
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
