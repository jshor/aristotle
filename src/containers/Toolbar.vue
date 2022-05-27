<template>
  <div class="toolbar">
      <div class="toolbar__fixed">
        <toolbar-button :icon="faScrewdriverWrench" text="Toolbox" is-toolbox @click="store.toggleToolbox" :active="store.isToolboxOpen" />
        <toolbar-separator />
      </div>

      <scroll-fade class="toolbar__scrollable">
      <div class="toolbar__left">
        <toolbar-button :icon="faFolderOpen" text="Open" />
        <toolbar-button :icon="faFile" text="New" />
        <toolbar-button :icon="faSave" text="Save" />
        <toolbar-separator />
        <toolbar-button @click="store.undo" :disabled="!store.canUndo" :icon="faReply" text="Undo" />
        <toolbar-button @click="store.redo" :disabled="!store.canRedo" :icon="faShare" text="Redo" />
        <toolbar-separator />
        <toolbar-button @click="store.rotate(1)" :disabled="!store.hasSelectedItems" :icon="faRotateForward" text="Rotate" />
        <toolbar-separator />
        <toolbar-button @click="store.group" :disabled="!store.canGroup" :icon="faObjectGroup" text="Group" />
        <toolbar-button @click="store.ungroup" :disabled="!store.canUngroup" :icon="faObjectUngroup" text="Ungroup" />
        <toolbar-separator />
        <toolbar-button :icon="faScissors" text="Cut" />
        <toolbar-button :icon="faCopy" text="Copy" />
        <toolbar-button :icon="faPaste" text="Paste" />
        <toolbar-button @click="store.deleteSelection" :disabled="!store.hasSelection" :icon="faBan" text="Delete" />
        <toolbar-separator />
        <toolbar-button @click="store.saveIntegratedCircuit" :icon="faMicrochip" text="Build IC" />
      </div>

      <div class="toolbar__right">
        <toolbar-button :icon="faBug" :active="store.isDebugging" @click="store.toggleDebugger" text="Debug" />
        <toolbar-separator />
        <toolbar-button :icon="faArrowsRotate" @click="store.reset" text="Reset" />
        <toolbar-button :icon="faForwardStep" :disabled="!store.isDebugging || store.isCircuitEvaluated" @click="store.stepThroughCircuit" text="Next" />
        <toolbar-separator />
        <toolbar-button :icon="faWaveSquare" :disabled="store.isDebugging" :active="!store.isDebugging && store.isOscilloscopeOpen" @click="store.toggleOscilloscope" text="Monitor" />
      </div>
      </scroll-fade>

  </div>
</template>

<script lang="ts">
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
  faScrewdriverWrench,
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
import { DocumentStore } from '@/store/document'
import { StoreDefinition } from 'pinia'
import { defineComponent, PropType, computed } from 'vue'
import ToolbarButton from '../components/toolbar/ToolbarButton.vue'
import ToolbarSeparator from '../components/toolbar/ToolbarSeparator.vue'
import ScrollFade from '../components/layout/ScrollFade.vue'

export default defineComponent({
  name: 'Toolbar',
  components: {
    ToolbarButton,
    ToolbarSeparator,
    ScrollFade
  },
  data () {
    return {
      faScrewdriverWrench,
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
      type: Function as PropType<DocumentStore>,
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
  align-items: center;
  background-color: var(--color-bg-secondary);
  box-sizing: border-box;
  box-shadow: 0 0 $border-width var(--color-shadow);
  padding: 0.25em;


  &__scrollable, &__fixed {
    display: flex;
    align-items: center;
  }

  &__scrollable, &__left {
    flex: 1;
  }

  &__left, &__right {
    border: $border-width solid var(--color-bg-secondary);
    display: flex;
    align-items: center;
  }
}
</style>
