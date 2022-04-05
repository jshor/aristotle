<template>
  <draggable
    :tabindex="-1"
    :position="{
      x: boundingBox.left,
      y: boundingBox.top
    }"
    :style="{
      width: `${boundingBox.right - boundingBox.left}px`,
      height: `${boundingBox.bottom - boundingBox.top}px`,
      zIndex
    }"
    :zoom="zoom"
    :bounding-box="boundingBox"
  >
    <group-box :is-selected="isSelected" />
  </draggable>
</template>

<script lang="ts">
import { mapState } from 'pinia'
import { defineComponent, PropType } from 'vue'
import { useDocumentStore } from '../store/document'
import Draggable from '../components/Draggable.vue'
import GroupBox from '../components/GroupBox.vue'
import Item from './Item.vue'

export default defineComponent({
  name: 'Group',
  components: {
    Draggable,
    GroupBox,
    Item
  },
  props: {
    boundingBox: {
      type: Object as PropType<BoundingBox>,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    zIndex: {
      type: Number,
      default: 0
    }
  },
  computed: {
    ...mapState(useDocumentStore, [
      'zoom'
    ])
  }
})
</script>

