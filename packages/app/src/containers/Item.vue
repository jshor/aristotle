<template>
  <draggable
    :position="position"
    :zoom="zoom"
    :style="{
      transform: `rotate(${90 * rotation}deg)`
    }"
    class="item"
    :class="{
      'item--selected': isSelected
    }"
    :snap-boundaries="snapBoundaries"
    :bounding-box="boundingBox"
    :force-dragging="forceDragging"
    @drag-start="setSnapBoundaries(id)"
    @drag="delta => moveElementPosition({ id, delta })"
    @mousedown="mousedown"
    @contextmenu="contextmenu"
  >
    <div class="item__freeport" v-if="type === 'Freeport'" />
    <logic-gate v-else />
    <div
      v-for="(ports, orientation) in portList"
      :key="orientation"
      :class="`item__ports--${orientation}`"
      class="item__ports">
      <Port
        v-for="port in ports"
        :id="port.id"
        :ref="port.id"
        :key="port.id"
        :type="port.type"
        :is-freeport="port.isFreeport"
        :siblings="portList"
        :position="port.position"
        :orientation="port.orientation + rotation"
        :rotation="rotation"
        :show-helper="port.showHelper"
      />
    </div>
  </draggable>
</template>

<script lang="ts">
import ResizeObserver from 'resize-observer-polyfill'
import { mapActions, mapGetters } from 'vuex'
import { defineComponent, PropType } from 'vue'
import LogicGate from '../components/LogicGate.vue'
import Port from './Port.vue'
import IPoint from '../interfaces/IPoint'
import Draggable from './Draggable.vue'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'Item',
  components: {
    LogicGate,
    Port,
    Draggable
  },
  props: {
    position: {
      type: Object as PropType<IPoint>,
      default: () => ({
        x: 0,
        y: 0
      })
    },
    boundingBox: {
      type: Object,
      default: () => ({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      })
    },
    rotation: {
      type: Number,
      default: 0
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: null
    },
    ports: {
      type: Array,
      default: () => []
    },
    properties: {
      type: Object,
      default: () => ({})
    },
    groupId: {
      type: String,
      default: null
    },
    id: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      forceDragging: false
    }
  },
  mounted () {
    const observer = new ResizeObserver(this.onSizeChanged)

    observer.observe(this.$el)

    if (this.isSelected) {
      // if the item is selected when it is created, then it is actively being drawn
      // allow for it to be moved when the mouse moves on first creation
      this.forceDragging = true
    }
  },
  computed: {
    ...mapState([
      'snapBoundaries'
    ]),
    ...mapGetters([
      'zoom'
    ]),
    portList () {
      const locations = ['left', 'top', 'right', 'bottom']

      return this
        .ports
        .reduce((map: any, port: any) => {
          return {
            ...map,
            [locations[port.orientation]]: [
              ...map[locations[port.orientation]],
              port
            ]
          }
        }, locations.reduce((m, type) => ({
          ...m, [type]: []
        }), {}))
    }
  },
  methods: {
    ...mapActions([
      'setSnapBoundaries',
      'updateItemPosition',
      'setElementSize',
      'moveElementPosition',
      'setElementBoundingBox'
    ]),

    onSizeChanged (target) {
      if (target[0]) {
        this.setElementSize({ id: this.id, rect: target[0].contentRect })
      }
    },

    mousedown ($event: MouseEvent) {
      this.$emit('select', { $event, id: this.id })
    },

    drag ({ delta, boundingBox, offset }) {
      this.moveElementPosition({ id: this.id, delta, boundingBox, offset })
    },

    dragEnd ({ delta, offset }) {
      // this.moveElementPosition({ id: this.id, delta, offset })
      this.setElementBoundingBox(this.id)
    },

    contextmenu ($event: MouseEvent) {
      if (this.groupId === null) {
        // show a context menu for this item only if it is not part of a group
        console.log('ELEMENT context menu', this.id)
      } else {
        console.log('PARENT GROUP context menu')
      }

      $event.preventDefault()
    }
  }
})
</script>

<style lang="scss">
.item {
  box-sizing: border-box;
  position: absolute;

  &__freeport {
    width: 1px;
    height: 1px;
    background: blue;
  }

  &__ports {
    position: relative;
    display: flex;
    align-items: center;
    position: absolute;

    &--left, &--right {
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      width: 50%;
    }

    &--left {
      justify-content: flex-start;
    }

    &--right {
      left: 50%;
      justify-content: flex-end;
    }

    &--bottom, &--top {
      flex: 1;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      height: 50%;
      justify-content: center;
    }

    &--bottom {
      top: 50%;
      align-items: flex-end;
    }

    &--top {
      bottom: 50%;
      align-items: flex-start;
    }
  }

  &--selected {
    opacity: 0.5;
  }
}
</style>
