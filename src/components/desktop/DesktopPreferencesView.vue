<template>
  <div class="desktop-preferences-view">
    <ul class="desktop-preferences-view__sidebar">
      <li
        v-for="(tab, index) in tabs"
        :key="index"
        :class="{
          'desktop-preferences-view__link--active': tab === currentTab
        }"
        tabindex="0"
        class="desktop-preferences-view__link"
        @click="changeTab(tab)"
        @keydown.space="changeTab(tab)"
      >
        {{ tab.props.title }}
      </li>
    </ul>

    <component
      :is="currentTab"
      :key="currentTab"
    />
  </div>
</template>

<script lang="ts" setup>
import { useSlots, shallowRef, onMounted } from 'vue'
import type { ComponentPublicInstance, ShallowRef } from 'vue'
import DesktopPreferencesSubview from './DesktopPreferencesSubview.vue'

type TabType = ComponentPublicInstance<typeof DesktopPreferencesSubview>

const tabs: ShallowRef<TabType[]> = shallowRef([])
const currentTab = shallowRef()
const slots = useSlots()

onMounted(() => {
	if (slots !== null) {
		slots.default?.().map((child: unknown) => {
			tabs.value.push(child as TabType)
		})

		currentTab.value = tabs.value[0]
	}
})

const changeTab = (tab: TabType) => {
	currentTab.value = tab
}
</script>

<style lang="scss">
.desktop-preferences-view {
  display: flex;
  height: 100%;
  width: 100%;
  color: var(--color-primary);
  border-top: 1px solid var(--color-bg-secondary);

  &__sidebar {
    display: flex;
    flex-direction: column;
    width: 3em;
    flex: 0.3;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__link {
    padding: 1em;
    cursor: pointer;
    transition: all 0.25s;
    border-bottom: 1px solid var(--color-bg-secondary);

    &--active {
      cursor: default;
    }

    &--active, &:active, &:hover {
      background-color: var(--color-bg-secondary);
    }
  }
}
</style>
