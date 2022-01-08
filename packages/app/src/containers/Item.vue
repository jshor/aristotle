<template>
  <div class="item" :style="style">
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
        :siblings="portList"
        :position="position"
        :orientation="port.orientation"
        :rotation="rotation"
        :draggable="type !== 'Freeport'"
        :show-helper="port.showHelper"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import LogicGate from '../components/LogicGate.vue'
import Port from './Port.vue'
import IPoint from '../interfaces/IPoint'

export default defineComponent({
  name: 'Item',
  components: {
    LogicGate,
    Port
  },
  props: {
    position: {
      type: Object as PropType<IPoint>,
      default: () => ({
        x: 0,
        y: 0
      })
    },
    offset: {
      type: Object as PropType<IPoint>,
      default: () => ({
        x: 0,
        y: 0
      })
    },
    rotation: {
      type: Number,
      default: 0
    },
    parentRotation: {
      type: Number,
      default: 0
    },
    type: String,
    ports: {
      type: Array,
      default: () => []
    },
    properties: {
      type: Object,
      default: () => ({})
    },
    id: String
  },
  computed: {
    truePosition () {
      return {
        x: this.position.x - this.offset.x,
        y: this.position.y - this.offset.y
      }
    },
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
    },
    style () {
      return {
        left: `${this.truePosition.x}px`,
        top: `${this.truePosition.y}px`,
        transform: `rotate(${90 * this.rotation}deg)`
      }
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
}
</style>
