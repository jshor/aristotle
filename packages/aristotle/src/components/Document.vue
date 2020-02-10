<template>
  <div class="document">
    <split-pane
      :default-percent="editorDisplayPercent"
      split="horizontal"
      class="document__pane"
      :class="{ 'document__pane--resize-disabled': !oscilloscopeEnabled }">
      <template v-slot:paneL>
        <div class="document__editor">
          <slot name="editor" />
        </div>
      </template>
      <template v-if="oscilloscopeEnabled" v-slot:paneR>
        <div class="document__oscilloscope">
          <slot name="oscilloscope" />
        </div>
      </template>
    </split-pane>
  </div>
</template>

<script>
export default {
  name: 'Document',
  props: {
    oscilloscopeEnabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    editorDisplayPercent () {
      return this.oscilloscopeEnabled ? 80 : 100
    }
  }
}
</script>

<style lang="scss">
.document {
  &__pane {
    .splitter-pane {
      &:first-of-type {
        border: 1px solid #3D404B;
        background: #333641;
        padding: 2px;
        padding-top: 0;
        border-top: 0;
        box-sizing: border-box;
      }

      &-resizer {
        margin: 0 !important;
      }

      &.splitter-paneR.horizontal {
        padding-top: 11px;
        box-sizing: border-box;
      }
    }

    &--resize-disabled .splitter-pane-resizer {
      pointer-events: none;
      cursor: default;
    }
  }

  &__oscilloscope {
    background-color: #333641;
    border: 1px solid #464857;
    padding: 2px;
    height: 100%;
    box-sizing: border-box;
  }

  &__editor {
    overflow: hidden;
    background-color: #333641;
    box-sizing: border-box;
    height: 100%;

    svg {
      background-color: #1D1E25;
      position: relative !important;
    }
  }
}
</style>
