<template>
  <wire
    :source="source"
    :target="target"
    :top-left="topLeft"
    :bottom-right="bottomRight"
    :is-selected="isSelected"
    @mousedown="mousedown"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import Wire from '../components/Wire.vue'

export default defineComponent({
  name: 'Connection',
  components: {
    Wire
  },
  props: {
    source: {
      type: Object as PropType<Port>,
      required: true
    },
    target: {
      type: Object as PropType<Port>,
      required: true
    },
    groupId: {
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
    }
  },
  data () {
    return {
      newFreeport: {
        itemId: '',
        inputPortId: '',
        outputPortId: '',
        sourceId: '',
        targetId: '',
        position: {}
      },
      originalPosition: {
        x: 0,
        y: 0
      } as Point,
      portCreated: false,
      isMouseDown: false
    }
  },
  computed: {
    ...mapGetters([
      'zoom'
    ]),
    a () {
      return this.source.position
    },
    b () {
      return this.target.position
    },
    topLeft () {
      const x = Math.min(this.a.x, this.b.x)
      const y = Math.min(this.a.y, this.b.y)

      return { x, y }
    },
    bottomRight () {
      const x = Math.max(this.a.x, this.b.x)
      const y = Math.max(this.a.y, this.b.y)

      return { x, y }
    }
  },
  mounted () {
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  },
  destroy () {
    window.removeEventListener('mousemove', this.mousemove)
    window.removeEventListener('mouseup', this.mouseup)
  },
  methods: {
    ...mapActions([
      'createFreeport',
      'setSnapBoundaries'
    ]),

    mousedown ($event: MouseEvent) {
      if (this.groupId !== null) {
        // this wire is part of a group, so do not allow the creation of a new freeport
        return
      }

      this.portCreated = false
      this.isMouseDown = true
      this.originalPosition = {
        x: $event.clientX,
        y: $event.clientY
      }
    },

    mousemove ($event: MouseEvent) {
      if (this.originalPosition.x === $event.clientX && this.originalPosition.y === $event.clientY) return
      if (!this.isMouseDown) return

      this.originalPosition = {
        x: $event.clientX,
        y: $event.clientY
      }

      if (!this.portCreated) {
        const rand = () => `id_${(Math.floor(Math.random() * 1000000) + 5)}` // TODO: use uuid
        const { top, left } = this.$el.getBoundingClientRect() as DOMRectReadOnly
        const relativePosition: Point = {
          x: $event.clientX - left,
          y: $event.clientY - top
        }
        const absolutePosition: Point = {
          x: this.topLeft.x + relativePosition.x,
          y: this.topLeft.y + relativePosition.y
        }

        console.log('CREATING FREEPORT')

        this.newFreeport = {
          itemId: rand(),
          inputPortId: rand(),
          outputPortId: rand(),
          sourceId: this.source.id,
          targetId: this.target.id,
          position: absolutePosition
        }

        this.createFreeport(this.newFreeport)
        this.setSnapBoundaries(this.newFreeport.itemId)
        this.portCreated = true
      }
    },

    mouseup ($event: MouseEvent) {
      if (!this.isMouseDown) return

      this.isMouseDown = false
      this.$emit('select', $event)
    }
  }
})
</script>
