<template>
  <div class="toolbar">
      <div class="toolbar__fixed">
        <toolbar-button :icon="faScrewdriverWrench" text="Toolbox" is-toolbox @click="rootStore.toggleToolbox" :active="rootStore.isToolboxOpen" />
        <toolbar-separator />
      </div>

      <scroll-fade class="toolbar__scrollable">
      <div class="toolbar__left">
        <!-- <toolbar-button :icon="faFolderOpen" text="Open" /> -->
        <toolbar-button @click="rootStore.newDocument" :icon="faFile" text="New" />
        <!-- <toolbar-button :icon="faSave" text="Save" /> -->
        <toolbar-separator />
        <toolbar-button @click="documentStore.undo" :disabled="!documentStore.canUndo" :icon="faReply" text="Undo" />
        <toolbar-button @click="documentStore.redo" :disabled="!documentStore.canRedo" :icon="faShare" text="Redo" />
        <toolbar-separator />
        <toolbar-button @click="documentStore.rotate(1)" :disabled="!documentStore.hasSelectedItems" :icon="faRotateForward" text="Rotate" />
        <toolbar-separator />
        <toolbar-button @click="documentStore.group" :disabled="!documentStore.canGroup" :icon="faObjectGroup" text="Group" />
        <toolbar-button @click="documentStore.ungroup" :disabled="!documentStore.canUngroup" :icon="faObjectUngroup" text="Ungroup" />
        <toolbar-separator />
        <toolbar-button @click="documentStore.cut" :icon="faScissors" :disabled="!documentStore.hasSelectedItems" text="Cut" />
        <toolbar-button @click="documentStore.copy" :icon="faCopy" :disabled="!documentStore.hasSelectedItems" text="Copy" />
        <toolbar-button @click="documentStore.paste" :disabled="!rootStore.canPaste" :icon="faPaste" text="Paste" />
        <toolbar-button @click="documentStore.deleteSelection" :disabled="!documentStore.canDelete" :icon="faBan" text="Delete" />
        <toolbar-separator />
        <toolbar-button @click="rootStore.launchIntegratedCircuitBuilder" :icon="faMicrochip" text="Export" />
      </div>

      <div class="toolbar__right">
        <toolbar-button :icon="faBug" :active="documentStore.isDebugging" @click="documentStore.toggleDebugger()" text="Debug" />
        <toolbar-separator />
        <toolbar-button :icon="faArrowsRotate" @click="documentStore.resetCircuit" text="Reset" />
        <toolbar-button :icon="faForwardStep" :disabled="!documentStore.isDebugging || documentStore.isCircuitEvaluated" @click="documentStore.advanceSimulation" text="Next" />
        <toolbar-separator />
        <toolbar-button :icon="faWaveSquare" :disabled="documentStore.isDebugging" :active="!documentStore.isDebugging && documentStore.isOscilloscopeOpen" @click="documentStore.toggleOscilloscope" text="Analyze" />
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
import { useRootStore } from '@/store/root'
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
    const rootStore = useRootStore()
    const documentStore = props.store()

    return {
      rootStore,
      documentStore
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
