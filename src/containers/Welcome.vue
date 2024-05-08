<template>
  <main-view>
    <template #top>
      <mobile-preferences v-if="isMobile" />
    </template>

    <template #middle>
      <div class="welcome">
        <div class="welcome__content">
          <h1 class="welcome__title">{{ $t('appName') }}</h1>

          <h2 class="welcome__heading">Get started</h2>
          <modal-button
            @click="newDocument()"
            :text="$t('command.newDocument')"
            block
            inverted
          />
          <modal-button
            @click="selectDocument()"
            :text="$t('command.selectDocument')"
            block
            inverted
          />

          <h2 class="welcome__heading">Samples</h2>
          <modal-button
            @click="openSample"
            text="16-digit counter"
            block
            inverted
          />
        </div>
      </div>
    </template>
  </main-view>
</template>

<script lang="ts" setup>
import MobilePreferences from './MobilePreferences.vue'
import MainView from '@/components/layout/MainView.vue'
import ModalButton from '@/components/modal/ModalButton.vue'
import { useRootStore } from '@/store/root'

const store = useRootStore()

withDefaults(defineProps<{
  /** Whether or not the workspace is to be displayed in mobile mode. */
  isMobile: boolean
}>(), {
  isMobile: false
})

const {
  newDocument,
  selectDocument
} = store

function openSample () {
  store.openTestDocuments()
}
</script>

<style lang="scss">
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-primary);

  &__content {
    width: 100%;
    max-width: 30rem;
  }

  &__title {
    font-weight: 200;
  }

  &__heading {
    border-bottom: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-weight: 200;
    padding-bottom: 0.25em;
    margin-bottom: 0;
  }

  &__button {
    padding: 0.75em;
    font-family: var(--font-family);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-primary);
    border-radius: 3px;
    width: 100%;
    margin-top: 1em;
    cursor: pointer;

    &:hover {
      background-color: var(--color-primary);
      color: var(--color-bg-primary);
    }

    &:active {
      background-color: var(--color-secondary);
      color: var(--color-bg-primary);
    }
  }
}
</style>
