<template>
  <div
    @contextmenu="stopPropagation"
    @mousedown="stopPropagation"
    @mouseup="stopPropagation"
    @keydown.esc="onKeyDown"
    class="properties"
  >
    <div
      v-if="isOpen"
      class="properties__dialog"
      ref="propertiesRef"
      :aria-hidden="!isOpen"
    >
      <div class="properties__heading" role="title">
        Properties
        <icon
          :tabindex="0"
          :icon="faClose"
          @click="close"
          role="button"
          class="properties__close"
        />
      </div>

      <div
        v-for="(data, propertyName) in model"
        :key="propertyName"
        class="properties__entry"
      >
        <label
          :for="`${id}_${propertyName}`"
          class="properties__label"
        >
          {{ data.label }}
        </label>

        <select
          v-if="data.options"
          v-model="data.value"
          :id="`${id}_${propertyName}`"
          class="properties__input"
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
        <input
          v-else-if="data.type === 'boolean'"
          v-model="(data.value as boolean)"
          :id="`${id}_${propertyName}`"
          type="checkbox"
          class="properties__input"
          @change="onChange"
        />
        <input
          v-else
          v-model="data.value"
          :min="data.min"
          :max="data.max"
          :type="data.type"
          :id="`${id}_${propertyName}`"
          class="properties__input"
          @change="onChange"
        />
      </div>
    </div>

    <icon
      v-else
      @keydown.space="openProperties"
      @click="openProperties"
      :tabindex="0"
      :icon="faWrench"
      class="properties__icon"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, PropType, ref, watch } from 'vue'
import { faClose, faWrench } from '@fortawesome/free-solid-svg-icons'
import cloneDeep from 'lodash.clonedeep'
import Icon from '@/components/Icon.vue'

export default defineComponent({
  name: 'Properties',
  components: {
    Icon
  },
  props: {
    properties: {
      type: Object as PropType<PropertySet>,
      default: () => ({})
    },
    id: {
      type: String,
      default: ''
    },
    viewport: {
      type: Object as PropType<DOMRect>,
      required: true
    }
  },
  emits: {
    update: (id: string, properties: PropertySet) => true,
    pan: (point: Point, animate: boolean) => true
  },
  setup (props, { emit }) {
    const propertiesRef = ref<HTMLElement>()
    const isOpen = ref(false)
    const model = ref<PropertySet>(cloneDeep(props.properties))

    watch(props.properties, value => {
      model.value = cloneDeep(value)
    }, { deep: true })

    function close ($event: Event) {
      isOpen.value = false
      $event.preventDefault()
    }

    function onKeyDown ($event: KeyboardEvent) {
      close($event)
      propertiesRef.value?.focus()
    }

    function stopPropagation ($event: MouseEvent) {
      $event.stopPropagation()
    }

    function onChange () {
      emit('update', props.id, model.value)
    }

    function openProperties () {
      isOpen.value = true

      nextTick(() => {
        if (!propertiesRef.value) return

        const { bottom, right } = propertiesRef.value.getBoundingClientRect()
        const deltaX = Math.max(right - props.viewport.right, 0)
        const deltaY = Math.max(bottom - props.viewport.bottom, 0)

        if (deltaX > 0 || deltaY > 0) {
          emit('pan', {
            x: -deltaX,
            y: -deltaY
          }, true)
        }
      })
    }

    return {
      faClose,
      faWrench,
      model,
      isOpen,
      propertiesRef,
      close,
      onKeyDown,
      onChange,
      openProperties,
      stopPropagation
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
  pointer-events: all;
  touch-action: auto;
  z-index: 9999;
  filter: drop-shadow(0px 0px 3px black);

  &__icon {
    cursor: pointer;
    transition: all 0.25s;

    &:hover, &:focus {
      transform: scale(2);
    }
  }

  &__dialog {
    pointer-events: all;
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
    border: 1px solid var(--color-secondary);
    padding: 0.25em;
    box-sizing: border-box;
  }

  &__heading {
    font-size: 1.25em;
    padding-bottom: 0.25em;
    margin: 0 0.25em;
    margin-bottom: 0.25em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-secondary);
  }

  &__close {
    cursor: pointer;
    width: 0.5em;

    &:hover {
      color: var(--color-secondary);
    }
  }

  &__entry {
    display: grid;
    grid-template-columns: 50% 50%;
  }

  &__input, &__label {
    max-width: 100%;
    margin: 0.25em;
  }

  &__input {
    box-sizing: border-box;
    background-color: var(--color-bg-tertiary);
    border: 1px solid var(--color-secondary);
    font-family: system-ui, sans-serif;
  }
}
</style>
