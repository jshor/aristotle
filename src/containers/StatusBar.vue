<template>
  <status-bar-viewer>
    <template v-slot:left>
      {{ status }}
    </template>
    <template v-slot:right>
      <status-bar-button
        :title="$t('button.zoomOut')"
        :disabled="store.zoomLevel <= 0.1"
        @click="store.incrementZoom(-1)"
      >
        <icon :icon="faMinus" />
      </status-bar-button>
      <status-bar-zoom
        type="range"
        class="status-bar__range"
        :min="0"
        :step="10"
        :max="200"
        :zoom="store.zoomLevel"
        @zoom="zoom => store.setZoom({ zoom })"
      />
      <status-bar-button
        :title="$t('button.zoomIn')"
        :disabled="store.zoomLevel >= 2.0"
        @click="store.incrementZoom(1)"
      >
        <icon :icon="faPlus" />
      </status-bar-button>
      <status-bar-button
        width="3em"
        @click="store.setZoom({ zoom: 1 })"
      >
        {{ zoomPercent }}%
      </status-bar-button>
      <status-bar-button
        :title="$t('button.fullscreen')"
        @click="$emit('fullscreen')"
      >
        <icon :icon="isFullscreen ? faCompress : faExpand" />
      </status-bar-button>
    </template>
  </status-bar-viewer>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { faMinus, faPlus, faCompress, faExpand } from '@fortawesome/free-solid-svg-icons'
import StatusBarButton from '@/components/statusbar/StatusBarButton.vue'
import StatusBarViewer from '@/components/statusbar/StatusBarViewer.vue'
import StatusBarZoom from '@/components/statusbar/StatusBarZoom.vue'
import Icon from '@/components/Icon.vue'
import { DocumentStore } from '@/store/document'
import { DocumentStatus } from '@/types/enums/DocumentStatus'

export default defineComponent({
  name: 'StatusBar',
  components: {
    Icon,
    StatusBarButton,
    StatusBarViewer,
    StatusBarZoom
  },
  props: {
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    },
    isFullscreen: {
      type: Boolean,
      default: false
    }
  },
  setup (props) {
    const { t } = useI18n()
    const store = props.store()
    const status = computed(() => {
      switch (store.status) {
        case DocumentStatus.Printing:
          return t('label.printing')
        case DocumentStatus.SavingImage:
          return t('label.renderingImage')
        default:
          return t('label.ready')
      }
    })
    const zoomPercent = computed(() => Math.round(store.zoomLevel * 100))

    return {
      store,
      status,
      zoomPercent,
      faMinus,
      faPlus,
      faExpand,
      faCompress
    }
  }
})
</script>
