<template>
  <div class="toolbar">
    <div class="toolbar__left">
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
      <toolbar-button :icon="faScissors" />
      <toolbar-button :icon="faCopy" />
      <toolbar-button :icon="faPaste" />
      <toolbar-button @click="store.deleteSelection" :disabled="!store.hasSelection" :icon="faBan">Delete selection</toolbar-button>
      <toolbar-separator />
      <toolbar-button @click="store.saveIntegratedCircuit" :icon="faMicrochip">Build IC</toolbar-button>
    </div>

    <div class="toolbar__right">
      <toolbar-button :icon="faBug" :active="store.isDebugging" @click="store.toggleDebugger" />
      <toolbar-separator />
      <toolbar-button :icon="faArrowsRotate" @click="store.reset" />
      <toolbar-button :icon="faForwardStep" :disabled="!store.isDebugging || store.isCircuitEvaluated" @click="store.stepThroughCircuit" />
      <toolbar-separator />
      <toolbar-button :icon="faWaveSquare" :disabled="store.isDebugging" :active="!store.isDebugging && store.isOscilloscopeEnabled" @click="store.toggleOscilloscope" />
    </div>
  </div>
</template>

<script lang="ts">
import { v4 as uuid } from 'uuid'
import {

  faFolderOpen,
  faFile,
  faSave,
  faObjectGroup,
  faObjectUngroup,
  faCopy,
  faPaste,
} from '@fortawesome/free-regular-svg-icons'
import {
  faScissors,
  faRotateBackward,
  faRotateForward,
  faReply,
  faShare,
  faMicrochip,
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
      faPaste,
      faObjectGroup,
      faObjectUngroup,
      faRotateBackward,
      faRotateForward,
      faReply,
      faShare,
      faMicrochip,
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

    return {
      store,
      isComplete
    }
  }
})
</script>

<style lang="scss">
$border-width: 1px;

.toolbar {
  display: flex;
  background-color: var(--color-bg-secondary);
  padding: 0.25rem;
  height: 100%;
  box-shadow: 0 0 $border-width var(--color-shadow);

  &__left {
    flex: 1;
  }

  &__left, &__right {
    border: $border-width solid var(--color-bg-secondary);
    display: flex;
  }
}
</style>
