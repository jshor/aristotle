<template>
  <document :oscilloscope-enabled="document.editorModel.oscilloscopeEnabled">
    <template v-slot:editor>
      <div
        :id="document.id"
        :style="{
          width: '4998px',
          height: '4998px'
        }"
      />

      <properties
        v-if="isPropertiesDialogOpen"
        :properties="propertiesDialogPayload.properties"
        :position="propertiesDialogPayload.position"
        :element-id="propertiesDialogPayload.elementId"
        @change="updateProperties"
        @close="closePropertiesDialog"
      />

      <div class="zoom">
        <button
          class="zoom__out"
          :disabled="false"
          @click="setZoom(1)">
          <i class="fas fa-search-minus" />
        </button>
        <div class="zoom__level">{{ zoomLevel }}</div>
        <button
          class="zoom__out"
          @click="setZoom(-1)">
          <i class="fas fa-search-plus" />
        </button>
      </div>
    </template>

    <template v-slot:oscilloscope>
      <oscilloscope-container :waves="waves" />
    </template>
  </document>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { mapActions, mapGetters, mapState } from 'vuex'
import Properties from '@/components/Properties.vue'
import { Editor, PortSchematic, PropertiesDialogPayload, ElementProperties } from '@aristotle/editor'
import ICommand from '@/interfaces/ICommand'
import Document from '@/components/Document.vue'
import OscilloscopeContainer from './OscilloscopeContainer.vue'

@Component({
  name: 'DocumentContainer',
  components: {
    Document,
    OscilloscopeContainer,
    Properties
  },
  data () {
    return {
      waves: {}
    }
  },
  props: {
    document: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState([
      'activeDocumentId',
      'relayedCommand'
    ])
  },
  methods: {
    ...mapActions(['relayCommand'])
  },
  watch: {
    activeDocumentId: {
      handler () {
        this.setActivity()
      },
      immediate: true
    },
    relayedCommand: {
      handler (payload) {
        this.applyCommand(payload)
      },
      deep: true
    }
  }
})
export default class DocumentContainer extends Vue {
  public editor: Editor

  public isPropertiesDialogOpen: boolean = false

  public elementSettings: any = null

  public document: any

  public waves: any = {} // TODO

  public activeDocumentId: string

  public relayCommand: (command: ICommand) => void

  public propertiesDialogPayload: PropertiesDialogPayload = null

  get zoomLevel () {
    return this.document.editorModel.zoomLevel
  }

  get isActive () {
    return this.document.id === this.activeDocumentId
  }

  mounted () {
    this.editor = new Editor(this.document.id)
    this.editor.load(this.document.data)
    this.subscribeToEditorEvents(this.editor)
  }

  updateEditorModel (editor: Editor) {
    this.$store.commit('SET_EDITOR_MODEL', editor.getEditorModel())
  }

  applyCommand (command: ICommand) {
    if (this.isActive) {
      this.editor.applyCommand(command)
    }
  }

  onOscillation (editor: Editor, payload) {
    this.waves = payload
  }

  updateProperties (editor: Editor, payload: ElementProperties) {
    this.relayCommand({
      command: 'UPDATE_ELEMENT', // TODO: rename to something better
      payload,
      documentId: this.document.id
    })
  }

  openPropertiesDialog (editor: Editor, payload: PropertiesDialogPayload) {
    this.propertiesDialogPayload = payload
    this.isPropertiesDialogOpen = true
  }

  closePropertiesDialog () {
    this.propertiesDialogPayload = null
    this.isPropertiesDialogOpen = false
  }

  setZoom (factor) {
    const minZoom = 0.5
    const maxZoom = 5
    const increment = 0.25
    const l = this.zoomLevel + (factor * increment)

    this.relayCommand({
      command: 'SET_ZOOM',
      payload: factor,
      documentId: this.document.id
    })
  }

  /**
   * Updates the active status of the Editor.
   */
  setActivity () {
    const isFocused = this.isActive && document.hasFocus()

    this.relayCommand({
      command: 'SET_ACTIVITY',
      payload: isFocused,
      documentId: this.document.id
    })
  }

  /**
   * Maps of all Editor events to DocumentContainer methods.
   *
   * @param {Editor} editor
   */
  subscribeToEditorEvents = (editor: Editor): void => {
    const events = {
      'select': 'updateEditorModel',
      'deselect': 'updateEditorModel',
      'config:changed': 'updateEditorModel',
      'zoomed': 'updateEditorModel',
      'circuit:changed': 'updateEditorModel',
      'properties:open': 'openPropertiesDialog',
      'properties:close': 'closePropertiesDialog',
      'oscillate': 'onOscillation'
    }

    Object
      .keys(events)
      .forEach(event => editor.on(event, this[events[event]]))
  }
}
</script>

<style lang="scss">
.zoom {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: $color-bg-primary;
  border-radius: 2px;
  color: $color-primary;
  display: flex;
  box-sizing: border-box;
  border: 1px solid $color-bg-tertiary;

  &__in, &__out, &__level {
    padding: 0.25rem;
  }

  &__level {
    border-style: solid;
    border-color: $color-bg-tertiary;
    border-width: 0 1px;
    width: 2rem;
  }

  &__in, &__out {
    border: 0;
    outline: none;
    background-color: transparent;
    color: $color-primary;

    &:not(:disabled) {
      cursor: pointer;
    }

    &:hover:not(:disabled) {
      background-color: $color-bg-secondary;
    }

    &:active:not(:disabled) {
      background-color: $color-bg-tertiary;
    }

    &:disabled {
      color: $color-bg-secondary;
    }
  }
}

</style>
