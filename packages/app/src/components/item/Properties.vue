<template>
  <div
    @keydown.space="isOpen = true"
    @keydown.esc="onKeyDown"
    @click="isOpen = true"
    @contextmenu="stopPropagation"
    @mousedown="stopPropagation"
    @mouseup="stopPropagation"
    class="properties"
  >
  <div
    v-if="isOpen"
    class="properties__dialog"
    :aria-hidden="!isOpen"
  >
    <div class="properties__heading" role="title">
      Properties
      <span
        @click="isOpen = false"
        class="properties__close"
      >
        &times;
      </span>
    </div>

    <div
      v-for="(data, propertyName) in model"
      :key="propertyName"
      class="properties__entry"
    >
      <label :for="`${id}_${propertyName}`">{{ data.label }}</label>

      <select
        v-if="data.options"
        v-model="data.value"
        :id="`${id}_${propertyName}`"
        class="properties__input"
      >
        <option
          v-for="(value, key) in data.options"
          :key="key"
          :value="value"
        >
          {{ key }}
        </option>
      </select>
      <input
        v-else-if="data.type === 'boolean'"
        v-model="data.value"
        :id="`${id}_${propertyName}`"
        type="checkbox"
        class="properties__input"
      />
      <input
        v-else
        v-model="data.value"
        :min="data.min"
        :max="data.max"
        :type="data.type"
        :id="`${id}_${propertyName}`"
        class="properties__input"
      />

    </div>
  </div>
</div>
</template>

<script lang="ts">
import { cloneDeep } from 'lodash' // TODO
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'Properties',
  props: {
    properties: {
      type: Object as PropType<PropertySet>,
      default: () => ({})
    },
    id: {
      type: String,
      default: ''
    }
  },
  emits: ['update'],
  data () {
    return {
      model: {} as PropertySet,
      isOpen: false
    }
  },
  watch: {
    properties: {
      handler (properties: PropertySet) {
        this.model = cloneDeep<PropertySet>(properties)
      },
      deep: true,
      immediate: true
    },
    model: {
      handler (properties: PropertySet) {
        this.$emit('update', {
          id: this.id,
          properties
        })
      },
      deep: true
    }
  },
  methods: {
    onKeyDown ($event: KeyboardEvent) {
      this.isOpen = false
      $event.preventDefault()
      this.$el.focus()
    },
    stopPropagation ($event: MouseEvent) {
      $event.stopPropagation()
    }
  }
})
</script>

<style lang="scss">
.properties {
  position: absolute;
  top: 0;
  right: -20px;
  width: 16px;
  height: 16px;
  background-color: red;
  pointer-events: all;

  &__dialog {
    pointer-events: all;
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    background-color: #fff;
    color: #000;
    border: 1px solid #000;
    padding: 0.25em 0.5em;
    box-sizing: border-box;
  }

  &__heading {
    font-weight: bold;
    font-size: 1.25em;
    padding-bottom: 0.25em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #000;
  }

  &__close {
    cursor: pointer;
  }

  &__entry {
    display: grid;
    grid-template-columns: 50% 50%;
  }

  &__input {
    max-width: 100%;
  }
}
</style>
