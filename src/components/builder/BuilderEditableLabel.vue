<template>
  <div class="builder-editable-label">
    <div
      :tabindex="0"
      :class="{
        'builder-editable-label__read-only--hidden': !isReadOnly
      }"
      class="builder-editable-label__read-only"
      @focus="onFocus">
      {{ modelValue }}
    </div>
    <input
      v-if="!isReadOnly"
      class="builder-editable-label__textbox"
      type="text"
      ref="inputRef"
      :value="modelValue"
      @input="onInput"
      @blur="isReadOnly = true"
    />
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref } from 'vue'

export default defineComponent({
  name: 'BuilderEditableLabel',
  props: {
    modelValue: {
      type: String,
      default: 'node'
    }
  },
  setup (_, { emit }) {
    const isReadOnly = ref(true)
    const inputRef = ref<HTMLInputElement>()

    function onFocus () {
      isReadOnly.value = false

      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus()
          inputRef.value.select()
        }
      })
    }

    function onInput ($event: Event) {
      const { value } = $event.target as HTMLInputElement

      emit('update:modelValue', value)
    }

    return {
      isReadOnly,
      inputRef,
      onFocus,
      onInput
    }
  }
})
</script>

<style lang="scss">
.builder-editable-label {
  position: relative;
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  z-index: 9999;

  &__read-only, &__textbox {
    font-family: var(--font-family);
    display: flex;
    align-items: center;
    height: 100%;
    font-size: 1em;
    max-width: 20vw;
    padding: 0 0.25em;
    margin: 0;
    border: 0;
    background-color: transparent;
    box-sizing: border-box;
    white-space: nowrap;
  }

  &__read-only {
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-secondary);

    &--hidden {
      opacity: 0;
    }
  }

  &__textbox {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
