<template>
  <mobile-header
    @select="isDocumentSelectOpen = true"
    @open="isMobilePulloutOpen = true"
    :document-name="activeDocument?.displayName"
    :document-count="documentCount"
  />

  <mobile-pullout v-model="isMobilePulloutOpen">
    <mobile-pullout-heading @close="closePullout()" />
    <mobile-button
      :icon="faFile"
      :label="$t('command.newDocument')"
      @click="closePullout() && newDocument()"
    />
    <mobile-button
      :icon="faCodeBranch"
      :label="$t('command.selectDocument')"
      @click="closePullout() && selectDocument()"
    />
    <mobile-button
      :icon="faMicrochip"
      :label="$t('command.importDocument')"
      @click="closePullout() && selectDocument(true)"
    />
    <mobile-button
      v-if="documentCount"
      :icon="faImage"
      :label="$t('command.exportImage')"
      @click="closePullout() && exportImage()"
    />

    <mobile-collapsible-panel
      :title="$t('command.colors')"
      :icon="faPalette"
    >
      <property-form
        v-model="colors"
        id="section1"
      />
    </mobile-collapsible-panel>

    <mobile-collapsible-panel
      :title="$t('command.grid')"
      :icon="faTableCells"
    >
      <property-form
        v-model="grid"
        id="section1"
      />
    </mobile-collapsible-panel>

    <mobile-collapsible-panel
      :title="$t('command.snapping')"
      :icon="faMagnet"
    >
      <property-form
        v-model="snapping"
        id="section1"
      />
    </mobile-collapsible-panel>

    <mobile-collapsible-panel
      :title="$t('command.simulation')"
      :icon="faGears"
    >
      <property-form
        v-model="simulation"
        id="section1"
      />
    </mobile-collapsible-panel>

    <mobile-collapsible-panel
      :title="$t('command.experience')"
      :icon="faWandMagicSparkles"
    >
      <property-form
        v-model="experience"
        id="section1"
      />
    </mobile-collapsible-panel>

  </mobile-pullout>

  <mobile-popout-menu v-model="isDocumentSelectOpen">
    <mobile-document-tab-item
      v-for="(document, id) in documents"
      :key="id"
      :label="document.displayName"
      :dirty="document.store().isDirty"
      :active="activeDocumentId === id"
      @activate="activateDocument(id.toString())"
      @close="closeDocument(id.toString())"
    />
  </mobile-popout-menu>
</template>

<script lang="ts" setup>
import {
  faFile,
  faCodeBranch,
  faGears,
  faImage,
  faMagnet,
  faMicrochip,
  faPalette,
  faTableCells,
  faWandMagicSparkles
} from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'
import MobileButton from '@/components/mobile/MobileButton.vue'
import MobileCollapsiblePanel from '@/components/mobile/MobileCollapsiblePanel.vue'
import MobileDocumentTabItem from '@/components/mobile/MobileDocumentTabItem.vue'
import MobileHeader from '@/components/mobile/MobileHeader.vue'
import MobilePopoutMenu from '@/components/mobile/MobilePopoutMenu.vue'
import MobilePullout from '@/components/mobile/MobilePullout.vue'
import MobilePulloutHeading from '@/components/mobile/MobilePulloutHeading.vue'
import PropertyForm from '@/components/properties/PropertyForm.vue'
import { usePreferencesStore } from '@/store/preferences'
import { useRootStore } from '@/store/root'
import {
  DEFAULT_FILE_EXTENSION,
  INTEGRATED_CIRCUIT_FILE_EXTENSION
} from '@/constants'
import { DocumentStatus } from '@/types/enums/DocumentStatus'

const preferencesStore = usePreferencesStore()
const rootStore = useRootStore()
const {
  colors,
  grid,
  snapping,
  simulation,
  experience
} = storeToRefs(preferencesStore)

const {
  activeDocument,
  activeDocumentId,
  documents,
  documentCount,
  isDocumentSelectOpen,
  isMobilePulloutOpen
} = storeToRefs(rootStore)

const {
  newDocument,
  selectDocument
} = rootStore

const {
  activateDocument,
  closeDocument
} = rootStore

/**
 * Closes the pullout.
 */
function closePullout () {
  isMobilePulloutOpen.value = false
  return true
}

/**
 * Exports the current circuit as an image.
 */
function exportImage () {
  activeDocument.value!.store().status = DocumentStatus.SavingImage
}
</script>
