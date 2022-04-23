<template>
  <div class="toolbar">
    <toolbar-button :icon="faFolderOpen" />
    <toolbar-button :icon="faFile" />
    <toolbar-button :icon="faSave" />
    <toolbar-separator />
    <toolbar-button @click="store.undo" :disabled="!store.canUndo" :icon="faReply">Undo</toolbar-button>
    <toolbar-button @click="store.redo" :disabled="!store.canRedo" :icon="faShare">Redo</toolbar-button>
    <toolbar-separator />
    <toolbar-button @click="store.rotate(-1)" :disabled="!store.hasSelectedItems" :icon="faRotateBackward">Rotate 90&deg; CCW</toolbar-button>
    <toolbar-button @click="store.rotate(1)" :disabled="!store.hasSelectedItems" :icon="faRotateForward">Rotate 90&deg; CW</toolbar-button>
    <toolbar-separator />
    <toolbar-button @click="store.group" :disabled="!store.canGroup" :icon="faObjectGroup">Group</toolbar-button>
    <toolbar-button @click="store.ungroup" :disabled="!store.canUngroup" :icon="faObjectUngroup">Ungroup</toolbar-button>
    <toolbar-separator />
    <toolbar-button @click="addLogicGate" :icon="faCodeBranch">Add NOR</toolbar-button>
    <toolbar-button @click="addLightbulb" :icon="faLightbulb">Add lightbulb</toolbar-button>
    <toolbar-button @click="addSwitch" :icon="faToggleOn">Add switch</toolbar-button>
    <toolbar-separator />
    <toolbar-button :icon="faScissors" />
    <toolbar-button :icon="faCopy" />
    <toolbar-button :icon="faPastafarianism" />
    <toolbar-button @click="store.deleteSelection" :disabled="!store.hasSelection" :icon="faBan">Delete selection</toolbar-button>
    <toolbar-separator />
    <toolbar-button @click="store.saveIntegratedCircuit" :icon="faMicrochip">Build IC</toolbar-button>
    <toolbar-separator />
    <toolbar-button @click="store.incrementZIndex(1)" :disabled="!store.hasSelectedItems">Bring forward</toolbar-button>
    <toolbar-button @click="store.incrementZIndex(-1)" :disabled="!store.hasSelectedItems">Send backward</toolbar-button>
    <toolbar-button @click="store.setZIndex(1)" :disabled="!store.hasSelectedItems">Send to back</toolbar-button>
    <toolbar-button @click="store.setZIndex(store.zIndex)" :disabled="!store.hasSelectedItems">Bring to front</toolbar-button>

    <toolbar-separator />
    <toolbar-button :icon="faBug" :active="store.isDebugging" @click="store.toggleDebugger" />
    <toolbar-separator />
    <toolbar-button :icon="faArrowsRotate" @click="store.reset" />
    <toolbar-button :icon="faForwardStep" :disabled="store.isCircuitEvaluated" @click="store.stepThroughCircuit" />
    <toolbar-separator />
    <toolbar-button :icon="faWaveSquare" :disabled="store.isDebugging" :active="!store.isDebugging && store.isOscilloscopeEnabled" @click="store.toggleOscilloscope" />
  </div>
</template>

<script lang="ts">
import { v4 as uuid } from 'uuid'
import {
  faFolderOpen,
  faFile,
  faSave,
  faScissors,
  faCopy,
  faPastafarianism,
  faObjectGroup,
  faObjectUngroup,
  faRotateBackward,
  faRotateForward,
  faReply,
  faShare,
  faMicrochip,
  faLightbulb,
  faToggleOn,
  faCodeBranch,
  faBan,
  faArrowsRotate,
  faBug,
  faForwardStep,
  faWaveSquare
} from '@fortawesome/free-solid-svg-icons'
import DocumentState from '@/store/DocumentState'
import { StoreDefinition } from 'pinia'
import { defineComponent, PropType, computed } from 'vue'
import ToolbarButton from '../components/toolbar/ToolbarButton.vue'
import ToolbarSeparator from '../components/toolbar/ToolbarSeparator.vue'
import ItemSubtype from '../types/enums/ItemSubtype'
import ItemType from '../types/enums/ItemType'

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
    ToolbarButton,
    ToolbarSeparator
  },
  data () {
    return {
      faFolderOpen,
      faFile,
      faSave,
      faScissors,
      faCopy,
      faPastafarianism,
      faObjectGroup,
      faObjectUngroup,
      faRotateBackward,
      faRotateForward,
      faReply,
      faShare,
      faMicrochip,
      faLightbulb,
      faToggleOn,
      faCodeBranch,
      faBan,
      faArrowsRotate,
      faBug,
      faForwardStep,
      faWaveSquare
    }
  },
  props: {
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const isComplete = computed(() => store.simulation.circuit.isComplete())

    function createItem (id: string, type: ItemType, subtype: ItemSubtype, width: number, height: number, ports: Port[] = []) {
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

      store.insertItem({ item, ports })
    }

    function addLogicGate () {
      const elementId = uuid()

      createItem(elementId, ItemType.LogicGate, ItemSubtype.Nor, 100, 150, [
        createPort(elementId, uuid(), 0, 1, 'Input Port 1'),
        createPort(elementId, uuid(), 0, 1, 'Input Port 2'),
        createPort(elementId, uuid(), 2, 0, 'Output Port')
      ])
    }

    function addLightbulb () {
      const elementId = uuid()

      createItem(elementId, ItemType.OutputNode, ItemSubtype.Lightbulb, 40, 40, [
        createPort(elementId, uuid(), 0, 1, 'Input Port')
      ])
    }

    function addSwitch () {
      const elementId = uuid()

      createItem(elementId, ItemType.InputNode, ItemSubtype.Switch, 40, 40, [
        createPort(elementId, uuid(), 2, 0, 'Output Port')
      ])
    }

    return {
      store,
      isComplete,
      addLogicGate,
      addLightbulb,
      addSwitch
    }
  }
})
</script>

<style lang="scss">
$color-bg-primary: #1D1E25;
$color-bg-secondary: #333641;
$color-bg-tertiary: #3D404B;
$color-bg-quaternary: #454857;

// foreground colors
$color-primary: #fff;
$color-secondary: #9ca0b1;
$color-shadow: #000;

$border-width: 1px;

.toolbar {
  padding: 1em;
  background-color: $color-bg-secondary;
  border: $border-width solid $color-bg-secondary;
  box-shadow: 0 0 $border-width $color-shadow;
  padding: 0.25rem;
  display: flex;
  height: 100%;
}
</style>
