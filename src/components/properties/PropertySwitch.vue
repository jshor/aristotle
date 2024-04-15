<template>
  <label
    class="property-switch"
    :class="{
      'property-switch--on': model,
      'property-switch--disabled': disabled
    }"
    tabindex="0"
    @keydown.space="$emit('update:modelValue', !model)"
  >
    <input
      v-model="model"
      :id="id"
      :disabled="disabled"
      type="checkbox"
      class="property-switch__input"
      @input="$emit('update:modelValue', !model)"
    />
    <div
      class="property-switch__trigger"
      :class="{
        'property-switch__trigger--on': model
      }"
    />
  </label>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'PropertySwitch',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: ''
    }
  },
  emits: {
    'update:modelValue': (value: boolean) => true
  },
  setup (props, { emit }) {
    const model = ref(props.modelValue)

    watch(() => props.modelValue, () => {
      model.value = props.modelValue
    })

    return { model }
  }
})
</script>

<style lang="scss">
.property-switch {
  display: inline-flex;
  align-items: center;
  width: 2em;
  height: 0.75em;
  border-radius: 1em;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-secondary);
  transition: all 300ms;
  cursor: pointer;

  &--on {
    background-color: green; // TODO: use brand color?
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__input {
    position: absolute;
    opacity: 0;
  }

  &__trigger {
    height: 1em;
    width: 1em;
    border-radius: 1em;
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-secondary);
    box-shadow: 0 0.1em 0.3em rgba(0,0,0,0.3);
    transition: all 300ms;
    margin-left: -2px;

    &--on {
      transform: translate3d(100%, 0, 0);
    }
  }
}
</style>
