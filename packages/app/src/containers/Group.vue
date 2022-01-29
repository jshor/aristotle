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
    :class="{
      'group--is-selected': isSelected
    }"
    :zoom="zoom"
    :bounding-box="boundingBox"
    class="group"
    @contextmenu="onContextMenu"
    @drag="delta => moveGroupPosition({ id, delta })"
    @mousedown="mousedown"
  />
</template>

<script lang="ts">
import { mapActions, mapGetters } from 'vuex'
import { defineComponent } from 'vue'
import Draggable from '../components/Draggable.vue'
import Item from './Item.vue'

export default defineComponent({
  name: 'Group',
  components: {
    Draggable,
    Item
  },
  props: {
    boundingBox: {
      type: Object,
      default: () => ({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
      })
    },
    id: {
      type: String,
      default: ''
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

    mousedown ($event: MouseEvent) {
      this.$emit('select', { $event, id: this.id })
    },

    onContextMenu ($event: MouseEvent) {
      console.log('GROUP context menu')
      $event.preventDefault()
    }
  }
})
</script>

<style lang="scss">
.group {
  border: 2px dashed #808080;
  box-sizing: border-box;
  position: absolute;
  pointer-events: none;

  &--is-selected {
    display: block;
    border-color: #000;
    pointer-events: all;
    cursor: move;
  }
}
</style>

