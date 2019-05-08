<template>
  <div class="toolbar">
    <div class="toolbar__group toolbar__group--left">

      <!-- only temporary, this button will be removed -->
      <button
        @click="$emit('openDocument')"
        class="toolbar-button">
        <i class="fas fa-folder-open" />
      </button>

      <div class="toolbar__separator" />
      <button
        :disabled="!editor.canUndo"
        @click="relayCommand('UNDO')"
        class="toolbar-button">
        <i class="fas fa-reply" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-share" />
      </button>
      <div class="toolbar__separator" />
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-cut" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-copy" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-paste" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-ban" />
      </button>
      <div class="toolbar__separator" />
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-arrows-alt" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-mouse-pointer" />
      </button>
      <div class="toolbar__separator" />
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-undo-alt" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-redo-alt" />
      </button>
      <div class="toolbar__separator" />
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-object-group" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('REDO')"
        class="toolbar-button">
        <i class="fas fa-object-ungroup" />
      </button>
      <div class="toolbar__separator" />
      <button
        :disabled="true"
        @click="relayCommand('CREATE_INTEGRATED_CIRCUIT')"
        class="toolbar-button">
        <i class="fas fa-table" />
      </button>
      <div class="toolbar__separator" />
      <button
        :disabled="true"
        @click="relayCommand('CREATE_INTEGRATED_CIRCUIT')"
        class="toolbar-button">
        <i class="fas fa-microchip" />
      </button>
    </div>
    <div class="toolbar__group toolbar__group--right">
      <button
        @click="relayCommand('TOGGLE_DEBUG')"
        class="toolbar-button">
        <i class="fas fa-bug" />
      </button>
      <div class="toolbar__separator" />
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('RESET')"
        class="toolbar-button toolbar-button--pull-right">
        <i class="fas fa-sync-alt" />
      </button>
      <button
        :disabled="!editor.canRedo"
        @click="relayCommand('STEP')"
        class="toolbar-button toolbar-button--pull-right">
        <i class="fas fa-step-forward" />
      </button>
      <div class="toolbar__separator" />
      <button
        @click="relayCommand('STEP')"
        class="toolbar-button toolbar-button--pull-right">
        <i class="fas fa-wave-square" />
      </button>
    </div>
  </div>
</template>

<script>
import DocumentModel from '@/models/DocumentModel'

export default {
  name: 'Toolbar',
  props: {
    document: {
      type: DocumentModel,
      required: true
    }
  },
  computed: {
    editor () {
      return this.document.editorModel
    }
  },
  methods: {
    relayCommand (command, payload) {
      return this.$emit('relayCommand', { command, payload })
    }
  }
}
</script>

<style lang="scss">

$color-bg-primary: #1D1E25;
$color-bg-secondary: #333641;
$color-bg-tertiary: #3D404B;
$color-bg-quaternary: #454857;

$color-primary: #fff;
$color-secondary: #9ca0b1;

$color-shadow: #000;

$border-width: 1px;
$scrollbar-width: 3px;

.toolbar {
  background-color: $color-bg-secondary;
  border: $border-width solid $color-bg-secondary;
  box-shadow: 0 0 $border-width $color-shadow;
  padding: 0.25rem;
  display: flex;

  &__separator {
    display: block;
    border-left: 1px solid $color-secondary;
    box-sizing: border-box;
    height: 90%;
    margin: 0.25rem;
    box-shadow: 0 0 $border-width $color-shadow;
    width: 1px;
  }

  &__group {
    flex: 1;
    display: flex;
    align-items: center;

    &--right {
      justify-content: flex-end;
    }
  }
}

.toolbar-button {
  display: flex;
  color: $color-primary;
  padding: 0.25rem 0;
  width: 1.85rem;
  font-size: 1.25rem;
  text-shadow: drop-shadow(0 0 1px $color-shadow);
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  border: 0;
  background: none;

  &:disabled {
    opacity: 0.25;
  }

  &:not(:disabled) {
    &:hover {
      background-color: $color-bg-quaternary;
    }
    &:active {
      background-color: $color-bg-tertiary;
    }
  }
}
</style>