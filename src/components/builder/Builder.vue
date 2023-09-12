<template>
  <container class="builder">
    <builder-drop-zone
      type="top"
      :get-child-payload="getCardPayload('top')"
      :ports="ports.top.children"
      @drop="onWireDrop"
    />

    <div class="builder__center">
      <builder-drop-zone
        type="left"
        :get-child-payload="getCardPayload('left')"
        :ports="ports.left.children"
        @drop="onWireDrop"
      />

      <builder-editable-label v-model="item.name" />

      <builder-drop-zone
        type="right"
        :get-child-payload="getCardPayload('right')"
        :ports="ports.right.children"
        @drop="onWireDrop"
      />
    </div>

    <builder-drop-zone
      type="bottom"
      :get-child-payload="getCardPayload('bottom')"
      :ports="ports.bottom.children"
      @drop="onWireDrop"
    />

  </container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import { Container } from 'vue3-smooth-dnd'
import BuilderDropZone from './BuilderDropZone.vue'
import BuilderEditableLabel from './BuilderEditableLabel.vue'
import PortType from '@/types/enums/PortType'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'

type DragResult = {
  removedIndex: number | null
  addedIndex: number | null
  payload: Port
}

const applyDrag = (arr: Port[], dragResult: DragResult) => {
  const { removedIndex, addedIndex, payload } = dragResult

  if (removedIndex === null && addedIndex === null) return arr

  const result = [...arr]
  let itemToAdd = payload

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0]
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd)
  }

  return result
}

type LocationType = 'top' | 'bottom' | 'left' | 'right'
type WireList = Record<LocationType, { children: any[] }>

export default defineComponent({
  name: 'Builder',
  components: {
    BuilderDropZone,
    BuilderEditableLabel,
    Container
  },
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: Object as PropType<Item>,
      required: true
    }
  },
  setup (props, { emit }) {
    const ports = ref<WireList>({
      left: {
        children: [] as Port[]
      },
      top: {
        children: [] as Port[]
      },
      right: {
        children: [] as Port[]
      },
      bottom: {
        children: [] as Port[]
      }
    })

    props
      .modelValue
      .portIds
      .forEach(portId => {
        const port = props.modelValue.integratedCircuit?.ports[portId]

        if (port) {
          ports.value[port.type === PortType.Input ? 'left' : 'right']
            .children
            .push(port)
        }
      })

    function emitModel () {
      const orientations = ['left', 'top', 'right', 'bottom']

      props.modelValue.portIds = []

      Object
        .keys(ports.value)
        .forEach(orientation => {
          const o = orientation as LocationType
          const { children } = ports.value[o]

          children.forEach((port: Port) => {
            port.orientation = orientations.indexOf(o)
            props.modelValue.portIds.push(port.id)
          })
        })


      emit('update:modelValue', props.modelValue)
    }

    function onWireDrop (location: LocationType, dropResult: DragResult) {
      const newWires = Object.assign({}, ports.value[location])

      ports.value[location].children = applyDrag(newWires.children, dropResult)

      emitModel()
    }

    function getCardPayload (location: LocationType) {
      return (index: number) => {
        return ports.value[location].children[index]
      }
    }

    return {
      item: props.modelValue,
      ports,
      onWireDrop,
      getCardPayload
    }
  }
})
</script>

<style lang="scss">
.builder {
  border: 1px solid var(--color-secondary);
  display: inline-block;
  margin: auto;

  &__name {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1em;
  }

  &__center {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
}
</style>
