<template>
  <toolbar>
    <template v-slot:left>
      <!-- file commands -->
      <toolbar-button
        @click="applyEditorCommand('New')"
        icon="file"
      />
      <toolbar-button
        @click="applyEditorCommand('Open')"
        icon="folder-open"
      />
      <toolbar-button
        @click="applyEditorCommand('Save')"
        icon="save"
      />

      <toolbar-separator />

      <!-- commandStack commands -->
      <toolbar-button
        :disabled="!editor.canUndo"
        @click="applyEditorCommand('Undo')"
        icon="reply"
      />
      <toolbar-button
        :disabled="!editor.canRedo"
        @click="applyEditorCommand('Redo')"
        icon="share"
      />

      <toolbar-separator />

      <!-- clipboard commands -->
      <toolbar-button
        @click="applyEditorCommand('Cut')"
        icon="cut"
      />
      <toolbar-button
        @click="applyEditorCommand('Copy')"
        icon="copy"
      />
      <toolbar-button
        @click="applyEditorCommand('Paste')"
        icon="paste"
      />
      <toolbar-button
        @click="applyEditorCommand('Delete')"
        icon="ban"
      />

      <toolbar-separator />

      <!-- mouse modes -->
      <toolbar-button
        :active="editor.mouseMode === 'Panning'"
        @click="applyEditorCommand('SetMouseMode', 'Panning')"
        icon="arrows-alt"
      />
      <toolbar-button
        :active="editor.mouseMode === 'Selection'"
        @click="applyEditorCommand('SetMouseMode', 'Selection')"
        icon="mouse-pointer"
      />

      <toolbar-separator />

      <!-- integrated circuit builder -->
      <toolbar-button
        :disabled="true"
        @click="applyEditorCommand('CreateIntegratedCircuit')"
        icon="microchip"
      />
    </template>

    <template v-slot:right>
      <!-- debugger tools -->
      <toolbar-button
        @click="applyEditorCommand('SetDebugger')"
        icon="bug"
      />

      <toolbar-separator />

      <toolbar-button
        @click="applyEditorCommand('ResetCircuit')"
        icon="sync-alt"
      />
      <toolbar-button
        :disabled="!editor.debugMode || editor.circuitComplete"
        @click="applyEditorCommand('TriggerCircuitStep')"
        icon="step-forward"
      />

      <toolbar-separator />

      <toolbar-button
        :disabled="editor.debugMode"
        :active="editor.oscilloscopeEnabled"
        @click="applyEditorCommand('ToggleOscilloscope')"
        icon="wave-square"
      />
    </template>
  </toolbar>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { mapActions } from 'vuex'
import { ICommand } from '@aristotle/editor'
import Toolbar from '@/components/Toolbar/Toolbar.vue'
import ToolbarButton from '@/components/Toolbar/ToolbarButton.vue'
import ToolbarSeparator from '@/components/Toolbar/ToolbarSeparator.vue'

@Component({
  name: 'ToolbarContainer',
  components: {
    Toolbar,
    ToolbarButton,
    ToolbarSeparator
  },
  props: {
    document: {
      type: Object,
      required: true
    }
  },
  computed: {
    editor () {
      return this.document.editorModel
    }
  },
  methods: {
    ...mapActions(['relayCommand'])
  }
})
export default class ToolbarContainer extends Vue {
  public document: any

  public relayCommand: (command: ICommand) => void

  public applyEditorCommand = (type: string, payload?: any) => {
    this.relayCommand({
      type,
      payload,
      documentId: this.document.id
    } as ICommand)
  }
}
</script>
