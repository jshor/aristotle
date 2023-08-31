<template>
  <div class="property-form">
    <div
      v-for="(data, propertyName) in model"
      :key="propertyName"
      class="property-form__entry"
    >
      <label
        :for="`${id}_${propertyName}`"
        :class="{
          'property-form__label--disabled': data.disabled
        }"
        class="property-form__label"
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
          v-model.boolean="data.value"
          :id="`${id}_${propertyName}`"
          :disabled="data.disabled"
          @update:modelValue="onSwitch(propertyName)"
        />
      </div>

      <!-- text boxes -->
      <input
        v-else
        v-model="data.value"
        :min="data.min"
        :max="data.max"
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

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'
import cloneDeep from 'lodash.clonedeep'
import PropertySwitch from '@/components/properties/PropertySwitch.vue'
import Icon from '@/components/Icon.vue'
import isMobile from '@/utils/isMobile'

export default defineComponent({
  name: 'PropertyForm',
  components: {
    Icon,
    PropertySwitch
  },
  props: {
    modelValue: {
      type: Object as PropType<PropertySet>,
      default: () => ({})
    },
    id: {
      type: String,
      default: ''
    }
  },
  setup (props, { emit }) {
    const getModel = (model: PropertySet): PropertySet => Object
      .keys(model)
      // filter to ensure mobile-only or desktop-only settings are visible appropriately
      .filter(key => isMobile
        ? !model[key].desktopOnly
        : !model[key].mobileOnly)
      .reduce((m, k) => ({
        ...m,
        [k]: cloneDeep(model[k])
      }), {})

    const model = ref<PropertySet>(getModel(props.modelValue))

    watch(() => props.modelValue, value => {
      model.value = getModel(value)
    }, { deep: true })

    function onSwitch (propertyName: string) {
      const property = model.value[propertyName]

      property.excludes?.forEach(p => {
        if (property.value && model.value[p].type === 'boolean') {
          model.value[p].value = false
        }
      })

      onChange()
    }

    function onChange () {
      emit('update:modelValue', model.value)
    }

    return {
      model,
      close,
      onSwitch,
      onChange
    }
  }
})
</script>

<style lang="scss">
.property-form {
  padding: 0.25em;
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
