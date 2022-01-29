<template>
  <draggable
    :position="{
      x: boundingBox.left,
      y: boundingBox.top
    }"
    :style="{
      width: `${boundingBox.right - boundingBox.left}px`,
      height: `${boundingBox.bottom - boundingBox.top}px`
    }"
    :zoom="zoom"
    :bounding-box="boundingBox"
    @contextmenu="onContextMenu"
    @drag="delta => moveGroupPosition({ id, delta })"
    @mousedown="$event => $emit('select', { $event, id })"
  >
    <group-box :is-selected="isSelected" />
  </draggable>
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { defineComponent, PropType } from 'vue'
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
    }
  },
  computed: {
    ...mapGetters([
      'zoom'
    ])
  },
  methods: {
    ...mapActions([
      'moveGroupPosition'
    ]),

    onContextMenu ($event: MouseEvent) {
      console.log('GROUP context menu')
      $event.preventDefault()
    }
  }
})
</script>

