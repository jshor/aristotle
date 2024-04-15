<template>
  <dialog-container
    :dialog-type="ViewType.Preferences"
    title="Preferences"
  >
    <desktop-preferences-view>
      <desktop-preferences-subview title="Colors">
        <property-form
          v-model="colors"
          id="section1"
        />
      </desktop-preferences-subview>
      <desktop-preferences-subview title="Grid">
        <property-form
          v-model="grid"
          id="section1"
        />
      </desktop-preferences-subview>
      <desktop-preferences-subview title="Snapping">
        <property-form
          v-model="snapping"
          id="section1"
        />
      </desktop-preferences-subview>
      <desktop-preferences-subview title="Simulation">
        <property-form
          v-model="simulation"
          id="section1"
        />
      </desktop-preferences-subview>
      <desktop-preferences-subview title="Experience">
        <property-form
          v-model="experience"
          id="section1"
        />
      </desktop-preferences-subview>
    </desktop-preferences-view>
  </dialog-container>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import DesktopPreferencesSubview from '@/components/desktop/DesktopPreferencesSubview.vue'
import DesktopPreferencesView from '@/components/desktop/DesktopPreferencesView.vue'
import DialogContainer from './DialogContainer.vue'
import PropertyForm from '@/components/properties/PropertyForm.vue'
import { usePreferencesStore } from '@/store/preferences'
import { ViewType } from '@/types/enums/ViewType'

const preferencesStore = usePreferencesStore()

const {
  colors,
  grid,
  snapping,
  simulation,
  experience
} = storeToRefs(preferencesStore)
</script>
