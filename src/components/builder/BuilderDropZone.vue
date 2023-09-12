<template>
  <Container
    :orientation="orientation"
    :animation-duration="500"
    :group-name="type"
    :class="`builder-drop-zone builder-drop-zone--${orientation}`"
    @drop="onDrop"
    @drag-enter="onDragEnter"
    @drag-leave="onDragLeave"
    :should-accept-drop="() => true"
    :get-child-payload="getChildPayload"
    :get-ghost-parent="getGhostParent">
    <Draggable
      v-for="port in ports"
      :key="port.id"
      :tag="{
        value: 'div',
        props: {
          class: `builder-drop-zone__io builder-drop-zone__io--${type}`
        }
      }">
      <builder-editable-label v-model="port.name">
        <port-wire :type="type">
          <port-handle />
        </port-wire>
      </builder-editable-label>
    </Draggable>
  </Container>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType } from 'vue'
import { Container, Draggable } from 'vue3-smooth-dnd'
import BuilderEditableLabel from './BuilderEditableLabel.vue'
import PortHandle from '@/components/port/PortHandle.vue'
import PortWire from '@/components/port/PortWire.vue'
import Port from '@/types/interfaces/Port'

type DragResult = {
  removedIndex: number
  addedIndex: number
  payload: any
}
type LocationType = 'top' | 'bottom' | 'left' | 'right'

export default defineComponent({
  name: 'BuilderDropZone',
  components: {
    BuilderEditableLabel,
    Container,
    Draggable,
    PortHandle,
    PortWire
  },
  emits: {
    drop: (l: LocationType, p: DragResult) => !!(l && p)
  },
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    },
    getChildPayload: {
      type: Function as PropType<(i: number) => any>,
      required: true
    },
    type: {
      type: String as PropType<LocationType>,
      required: true
    }
  },
  computed: {
    orientation (): 'horizontal' | 'vertical' {
      return ['left', 'right'].includes(this.type)
        ? 'vertical'
        : 'horizontal'
    }
  },

  setup (props, { emit }) {
    const pattern = /--([a-z]+)/ig
    let draggedOrientation = ''

    function replaceModifiers (replacement: string) {
      document
        .querySelectorAll('.smooth-dnd-ghost, .smooth-dnd-ghost div')
        .forEach(element => {
          const matches = element.className.match(pattern)

          if (matches) {
            draggedOrientation = matches.pop() || ''
          }

          element.className = element
            .className
            .replace(pattern, replacement)
        })
    }

    function onDragEnter () {
      replaceModifiers(`--${props.type}`)
    }

    function onDragLeave () {
      replaceModifiers(draggedOrientation)
    }

    function onDrop (result: DragResult) {
      emit('drop', props.type, result)
    }

    function getGhostParent () {
      return document.querySelector('.modal')
    }

    return {
      onDragEnter,
      onDragLeave,
      onDrop,
      getGhostParent
    }
  }
})
</script>

<style lang="scss">
.builder-drop-zone {
  width: 100%;

  &__io {
    box-sizing: border-box;
    position: relative;
    overflow: visible !important;
    // display: inline-block !important;
    height: var(--integrated-circuit-wire-height) !important;

    &--left {
      text-align: left;
    }

    &--right {
      text-align: right;
    }
  }

  &--horizontal {
    display: grid !important;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    text-align: center;
    height: var(--integrated-circuit-wire-height);
  }

  &--vertical {
    display: flex !important;
    justify-content: space-around;
    flex-direction: column;
    min-height: var(--integrated-circuit-wire-height);
  }
}
</style>
