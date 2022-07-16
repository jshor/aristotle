<template>
  <div class="oscilloscope-title-bar">
    <div class="oscilloscope-title-bar__title">Oscilloscope</div>
    <div class="oscilloscope-title-bar__actions">
      <button
        class="oscilloscope-title-bar__button"
        title="Close"
        @click="$emit('close')"
      >
        <icon :icon="faClose" />
      </button>
      <button
        class="oscilloscope-title-bar__button"
        title="Clear oscilloscope"
        :disabled="!clearable"
        @click="$emit('clear')"
      >
        <icon :icon="faBan" />
      </button>
      <button
        class="oscilloscope-title-bar__button"
        title="Close"
        @click="$emit('toggle')"
      >
        <icon :icon="isRecording ? faPause : faPlay" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { faBan, faClose, faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import { defineComponent } from 'vue'
import Icon from '@/components/Icon.vue'

export default defineComponent({
  name: 'OscilloscopeTitleBar',
  components: {
    Icon
  },
  props: {
    /** Whether or not the timeline is clearable. */
    clearable: {
      type: Boolean,
      default: true
    },
    isRecording: {
      type: Boolean,
      default: true
    }
  },
  setup () {
    return {
      faBan,
      faClose,
      faPause,
      faPlay
    }
  }
})
</script>

<style lang="scss">
.oscilloscope-title-bar {
  display: flex;
  box-sizing: border-box;

  &__actions {
    flex: 1;
    justify-content: flex-end;
    display: flex;
  }

  &__title {
    padding: 0.5em;
  }

  &__button {
    color: var(--color-primary);
    background-color: transparent;
    border: 0;
    border-radius: 2px;
    padding: 0.75em;
    box-sizing: border-box;
    height: 3em;
    width: 3em;
    text-align: center;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    &:not(:disabled) {
      &:hover {
        background-color: var(--color-bg-quaternary);
      }

      &:active {
        background-color: var(--color-bg-tertiary);
      }
    }
  }
}
</style>
