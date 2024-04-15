<template>
  <div
    @contextmenu.stop
    @mousedown.stop
    @mouseup.stop
    @keydown.space="openProperties"
    class="properties"
    ref="propertiesRef"
    tabindex="0"
  >
    <teleport
      v-if="isMounted"
      to=".editor__grid"
    >
      <div
        v-if="isOpen"
        class="properties__overlay"
        @click="close"
        @touchstart="close"
      />

      <div
        v-if="isOpen"
        class="properties__dialog"
        ref="dialogRef"
        :style="dialogStyle"
        :tabindex="0"
        @keydown.esc="close"
        @touchstart.stop
      >
        <div class="properties__heading" role="title">
          Properties
          <icon
            :tabindex="0"
            :icon="faClose"
            @click.stop="close"
            @keydown.space="close"
            role="button"
            class="properties__close"
          />
        </div>

        <property-form
          v-model="model"
          :id="id"
        />

        <div
          tabindex="0"
          data-test="focus-end"
          @focus="dialogRef?.focus()"
        />
      </div>

      <icon
        v-else
        @click="openProperties"
        @touchend="openProperties"
        :style="iconStyle"
        :icon="faWrench"
        class="properties__icon"
      />
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, onMounted } from 'vue'
import { faClose, faGear as faWrench } from '@fortawesome/free-solid-svg-icons'
import cloneDeep from 'lodash.clonedeep'
import Icon from '@/components/Icon.vue'
import PropertyForm from '@/components/properties/PropertyForm.vue'
import ItemProperties from '@/types/interfaces/ItemProperties'
import Point from '@/types/interfaces/Point'
import BoundingBox from '@/types/types/BoundingBox'

const props = withDefaults(defineProps<{
  /** Set of item properties. */
  modelValue: ItemProperties
  /** Item ID. */
  id?: string
  /** Viewport rect. */
  viewport: DOMRect
  /** Item bounding box. */
  boundingBox: BoundingBox
  /** Zoom level of the document. */
  zoom: number
}>(), {
  modelValue: () => ({}),
  id: ''
})

const emit = defineEmits<{
  /** Model update. */
  (e: 'update:modelValue', properties: ItemProperties): void
  /** Panning request to the given point. */
  (e: 'pan', point: Point, animate: boolean): void
}>()

const dialogRef = ref<HTMLElement>()
const propertiesRef = ref<HTMLElement>()
const isOpen = ref(false)
const position = ref<Point>({ x: 0, y: 0 })
const iconStyle = computed(() => ({
  left: `${props.boundingBox.right + 16}px`,
  top: `${props.boundingBox.top}px`
}))
const dialogStyle = computed(() => ({
  ...iconStyle.value,
  transform: `scale(${1 / props.zoom})`
}))
const model = computed({
  get: () => cloneDeep(props.modelValue),
  set: value => emit('update:modelValue', value)
})
const isMounted = ref(false)

onMounted(() => isMounted.value = true)

watch(() => props.boundingBox, updatePosition)

function close ($event: Event) {
  propertiesRef.value?.focus()
  $event.preventDefault()
  $event.stopPropagation()
  isOpen.value = false
}

async function openProperties () {
  isOpen.value = true

  await nextTick()
  await updatePosition()
}

async function updatePosition () {
  position.value = {
    x: props.boundingBox.right + 10,
    y: props.boundingBox.top + 10
  }

  await nextTick()

  if (!dialogRef.value) return

  const { left, top, bottom, right } = dialogRef.value.getBoundingClientRect()
  const deltaMaxX = Math.max(right - props.viewport.right, 0)
  const deltaMaxY = Math.max(bottom - props.viewport.bottom, 0)
  const deltaMinX = Math.min(left - props.viewport.left, 0)
  const deltaMinY = Math.min(top - props.viewport.top, 0)

  if (deltaMaxX > 0 || deltaMaxY > 0) {
    emit('pan', {
      x: -deltaMaxX,
      y: -deltaMaxY
    }, true)
  }

  if (deltaMinX < 0 || deltaMinY < 0) {
    emit('pan', {
      x: -deltaMinX,
      y: -deltaMinY
    }, true)
  }

  dialogRef.value.focus()
}
</script>

<style lang="scss">
$outline-padding: 4px;
$icon-size: 20px;

.properties {
  position: absolute;
  right: -($icon-size + ($outline-padding * 2) + ($outline-border-width * 2) + 2);
  display: block;
  top: 0;
  width: $icon-size + ($outline-padding * 2);
  height: $icon-size + ($outline-padding * 2);
  pointer-events: all;
  touch-action: auto;
  filter: drop-shadow(0px 0px 3px black);

  &__icon {
    position: absolute;
    margin-top: $outline-padding;
    width: $icon-size;
    height: $icon-size;
    cursor: pointer;
    transition: transform 0.25s;
    color: var(--color-primary);
    z-index: 99999;

    &:hover, &:focus {
      transform: scale(2) rotate(180deg);
    }
  }

  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9998;
  }

  &__dialog {
    pointer-events: all;
    touch-action: auto;
    position: absolute;
    width: 200px;
    display: var(--media-display);
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
    border: 1px solid var(--color-secondary);
    padding: 0.25em;
    box-sizing: border-box;
    z-index: 9999;
    transform-origin: 0 0;
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
