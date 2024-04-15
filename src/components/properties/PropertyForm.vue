<template>
  <div class="property-form">
    <div
      v-for="(data, propertyName) in (model as Required<PropertyList>)"
      :key="propertyName"
      class="property-form__entry"
    >
      <label
        :for="`${id}_${propertyName}`"
        :class="{
          'property-form__label--disabled': data.disabled
        }"
        class="property-form__label"
        data-test="label"
      >
        {{ data.label }}
      </label>

      <!-- drop-down select -->
      <select
        v-if="data.options"
        v-model="data.value"
        :id="`${id}_${propertyName}`"
        :disabled="data.disabled"
        class="property-form__input"
        @change="onChange"
      >
        <option
          v-for="(value, key) in data.options"
          :key="key"
          :value="value"
        >
          {{ key }}
        </option>
      </select>

      <!-- toggle switch -->
      <div
        v-else-if="data.type === 'boolean'"
        class="property-form__switch"
      >
        <property-switch
          v-model.boolean="(data.value as boolean)"
          :id="`${id}_${propertyName}`"
          :disabled="data.disabled"
          @update:modelValue="onSwitch(propertyName)"
        />
      </div>

      <!-- numeric input -->
      <input
        v-else-if="data.type === 'number'"
        v-model="data.value"
        :min="data.min"
        :max="data.max"
        type="number"
        :id="`${id}_${propertyName}`"
        :disabled="data.disabled"
        class="property-form__input"
        @change="onChange"
      />

      <!-- text boxes -->
      <input
        v-else
        v-model="data.value"
        :type="data.type"
        :id="`${id}_${propertyName}`"
        :disabled="data.disabled"
        class="property-form__input"
        @change="onChange"
      />

      <small
        v-if="data.description"
        class="property-form__description"
      >
        {{ data.description }}
      </small>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import cloneDeep from 'lodash.clonedeep'
import PropertySwitch from '@/components/properties/PropertySwitch.vue'
import isMobile from '@/utils/isMobile'
import Property from '@/types/interfaces/Property'

type PropertyList = Record<string, Property<string | boolean | number>>

const props = withDefaults(defineProps<{
  /** Set of properties. */
  modelValue: PropertyList
  /** Custom ID for this property form. */
  id: string
}>(), {
  modelValue: () => ({}),
  id: ''
})

const emit = defineEmits<{
  /** Model update. */
  (e: 'update:modelValue', properties: PropertyList): void
}>()

const model = ref<PropertyList>(getModel(props.modelValue))

watch(() => props.modelValue, value => {
  model.value = getModel(value)
}, { deep: true })

function onSwitch (propertyName: keyof PropertyList) {
  const property = model.value[propertyName]

  property?.excludes?.forEach((p: keyof PropertyList) => {
    if (property.value && model.value[p].type === 'boolean') {
      model.value[p].value = false
    }
  })

  onChange()
}

function getModel (model: PropertyList) {
  const properties: PropertyList = {}

  for (const key in model) {
    const k = key as keyof PropertyList
    const isVisible = isMobile
      ? !model[k]!.desktopOnly
      : !model[k]!.mobileOnly

    if (isVisible) {
      properties[k] = cloneDeep(model[k])
    }
  }

  return properties
}

function onChange () {
  validate()
  emit('update:modelValue', model.value)
}

function validate () {
  for (const key in model.value) {
    const k = key as keyof PropertyList

    if (!isValidValue(model.value[k])) {
      model.value[k].value = props.modelValue[k].value
    }
  }
}

function isValidValue (property: Property<string | boolean | number>) {
  if (property.type === 'boolean') return true
  if (property.type === 'number') {
    const value = property.value as number

    if (property.max !== undefined && property.max < value) return false
    if (property.min !== undefined && property.min > value) return false

    return true
  }

  return !!property.value
}
</script>

<style lang="scss">
.property-form {
  padding: 0.25em;
  padding-top: 0;
  color: var(--color-primary);

  &__icon {
    cursor: pointer;
    transition: all 0.25s;

    &:hover, &:focus {
      transform: scale(2);
    }
  }

  &__entry {
    display: grid;
    grid-template-columns: 50% 50% 100%;
    margin-bottom: 0.5em;
  }

  &__label--disabled {
    color: var(--color-secondary);
  }

  &__input, &__label, &__switch, &__description {
    max-width: 100%;
    margin: 0.25em;
  }

  &__input {
    box-sizing: border-box;
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-family: system-ui, sans-serif;
    padding: 0.25em;
    width: auto;
    height: auto;

    &[type="color"] {
      padding: 0;

      &::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      &::-webkit-color-swatch {
        border: none;
      }
    }
  }

  &__switch {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__description {
    width: 100%;
    grid-column: 1/3;
    color: var(--color-secondary);
  }
}
</style>
