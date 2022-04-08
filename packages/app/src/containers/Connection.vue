<template>
  <wire
    :style="{ zIndex }"
    :source="source"
    :target="target"
    :top-left="topLeft"
    :bottom-right="bottomRight"
    :is-selected="isSelected"
    :aria-selected="isSelected"
    :label="'TODO'"
    :tabindex="0"
    @mousedown="onMouseDown"
    @focus="onFocus"
    ref="root"
  />
</template>

<script lang="ts">
import { ComponentPublicInstance, defineComponent, onBeforeUnmount, onMounted, PropType, ref } from 'vue'
import { StoreDefinition } from 'pinia'
import Wire from '../components/Wire.vue'
import DocumentState from '@/store/DocumentState'
import { computed } from '@vue/reactivity'

export default defineComponent({
  name: 'Connection',
  components: {
    Wire
  },
  props: {
    sourceId: {
      type: String,
      required: true
    },
    targetId: {
      type: String,
      required: true
    },
    groupId: {
      type: String,
      default: null
    },
    connectionChainId: {
      type: String,
      default: null
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      required: true
    },
    zIndex: {
      type: Number,
      default: 0
    },
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  watch: {
    isSelected (value: boolean) {
      if (value) {
        this.$el.focus()
      }
    }
  },
  setup (props, { emit }) {
    const store = props.store()
    const root = ref<ComponentPublicInstance<HTMLElement>>()

    const source = computed(() => store.ports[props.sourceId])
    const target = computed(() => store.ports[props.targetId])
    const topLeft = computed((): Point => {
      const a = source.value.position
      const b = target.value.position

      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)

      return { x, y }
    })
    const bottomRight = computed((): Point => {
      const a = source.value.position
      const b = target.value.position

      const x = Math.max(a.x, b.x)
      const y = Math.max(a.y, b.y)

      return { x, y }
    })

    onMounted(() => {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })

    let newFreeport = {
      itemId: '',
      inputPortId: '',
      outputPortId: '',
      connectionChainId: props.id,
      value: 0,
      sourceId: '',
      targetId: '',
      position: {}
    }
    let originalPosition: Point = {
      x: 0,
      y: 0
    }
    let portCreated = false
    let isMouseDown = false

    function onMouseDown ($event: MouseEvent) {
      if (props.groupId !== null) {
        // this wire is part of a group, so do not allow the creation of a new freeport
        return
      }

      portCreated = false
      isMouseDown = true
      originalPosition = {
        x: $event.clientX,
        y: $event.clientY
      }
      emit('select')
    }

    function onMouseMove ($event: MouseEvent) {
      if (originalPosition.x === $event.clientX && originalPosition.y === $event.clientY) return
      if (!isMouseDown) return

      originalPosition = {
        x: $event.clientX,
        y: $event.clientY
      }

      if (!portCreated && root.value?.$el) {
        const rand = () => `id_${(Math.floor(Math.random() * 1000000) + 5)}` // TODO: use uuid
        const { top, left } = root.value.$el.getBoundingClientRect()
        const relativePosition: Point = {
          x: $event.clientX - left,
          y: $event.clientY - top
        }
        const absolutePosition: Point = {
          x: topLeft.value.x + relativePosition.x,
          y: topLeft.value.y + relativePosition.y
        }

        newFreeport = {
          itemId: rand(),
          inputPortId: rand(),
          outputPortId: rand(),
          connectionChainId: props.connectionChainId,
          value: source.value.value,
          sourceId: source.value.id,
          targetId: target.value.id,
          position: absolutePosition
        }

        store.createFreeport(newFreeport)
        store.setSnapBoundaries(newFreeport.itemId)

        portCreated = true
      }
    }

    function onMouseUp () {
      if (!isMouseDown) return

      isMouseDown = false
      emit('select')
    }

    function onFocus () {
      if (!props.isSelected) {
        emit('select')
      }
    }

    return {
      root,
      topLeft,
      bottomRight,
      onMouseDown,
      onFocus,
      source,
      target
    }
  }
})
</script>
