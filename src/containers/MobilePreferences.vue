<template>
  <mobile-button
    :icon="faFile"
    label="New Circuit"
  />
  <mobile-button
    :icon="faCodeBranch"
    label="Load Circuit"
  />
  <mobile-button
    :icon="faMicrochip"
    label="Import integrated circuit"
  />
  <mobile-button
    :icon="faImage"
    label="Export image"
  />

  <mobile-collapsible-panel title="Colors" :icon="faPalette">
    <property-form
      v-model="colors"
      id="section1"
    />
  </mobile-collapsible-panel>

  <mobile-collapsible-panel title="Grid" :icon="faTableCells">
    <property-form
      v-model="grid"
      id="section1"
    />
  </mobile-collapsible-panel>

  <mobile-collapsible-panel title="Snapping" :icon="faMagnet">
    <property-form
      v-model="snapping"
      id="section1"
    />
  </mobile-collapsible-panel>

  <mobile-collapsible-panel title="Simulation" :icon="faGears">
    <property-form
      v-model="simulation"
      id="section1"
    />
  </mobile-collapsible-panel>

  <mobile-collapsible-panel title="Experience" :icon="faWandMagicSparkles">
    <property-form
      v-model="experience"
      id="section1"
    />
  </mobile-collapsible-panel>
</template>

<script lang="ts">
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
import { defineComponent } from 'vue'
import MobileButton from '@/components/mobile/MobileButton.vue'
import MobileCollapsiblePanel from '@/components/mobile/MobileCollapsiblePanel.vue'
import PropertyForm from '@/components/properties/PropertyForm.vue'
import { usePreferencesStore } from '@/store/preferences'

export default defineComponent({
  components: {
    MobileButton,
    MobileCollapsiblePanel,
    PropertyForm
  },
  name: 'MobilePreferences',
  setup () {
    const preferencesStore = usePreferencesStore()
    const {
      colors,
      grid,
      snapping,
      simulation,
      experience
    } = storeToRefs(preferencesStore)
    const { updateSettings } = preferencesStore

    return {
      faFile,
      faCodeBranch,
      faGears,
      faImage,
      faMagnet,
      faMicrochip,
      faPalette,
      faTableCells,
      faWandMagicSparkles,
      colors,
      grid,
      snapping,
      simulation,
      experience,
      updateSettings
    }
  }
})
</script>
