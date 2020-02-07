<template>
  <Container
    @drag-start="dragStart"
    @drag-end="dragEnd"
    class="ic"
    :class="{ 'ic--dragging': isDragging }">
    <div class="ic__col">
      <div>
        <Container
          orientation="vertical"
          class="ic__wire-container ic__wire-container--left"
          @drop="(e) => onWireDrop('left', e)"
          @drag-enter="setActiveOrientation('left')"
          @drag-leave="removeActiveOrientation('left')"
          :should-accept-drop="shouldAcceptDrop"
          :get-child-payload="getCardPayload('left')">
          <Draggable v-for="wire in wires.left" :key="wire.id">
            <Wire type="left" v-model="wire.label" @input="emitModelUpdate" />
          </Draggable>
        </Container>
      </div>
    </div>
    <div class="ic__col ic__col--center">
      <div>
        <Container
          orientation="horizontal"
          class="ic__wire-container ic__wire-container--top"
          @drop="(e) => onWireDrop('top', e)"
          @drag-enter="setActiveOrientation('top')"
          @drag-leave="removeActiveOrientation('top')"
          :should-accept-drop="shouldAcceptDrop"
          :get-child-payload="getCardPayload('top')">
          <Draggable v-for="wire in wires.top" :key="wire.id">
            <Wire type="top" v-model="wire.label" @input="emitModelUpdate" />
          </Draggable>
        </Container>
      </div>
      <div class="ic__center" :style="style">
        <div class="ic__title" :class="{ 'ic__title--vertical': isTitleVertical }">
          <input
            v-if="editing"
            @blur="stopEditing"
            v-model="title"
            ref="textbox"
            type="text"
            class="ic__textbox ic__textbox--edit"
          />
          <div
            v-else
            @click="startEditing"
            class="ic__textbox">
            {{ title }}
          </div>
        </div>
      </div>
      <div>
        <Container
          orientation="horizontal"
          class="ic__wire-container ic__wire-container--bottom"
          @drop="(e) => onWireDrop('bottom', e)"
          @drag-enter="setActiveOrientation('bottom')"
          @drag-leave="removeActiveOrientation('bottom')"
          :should-accept-drop="shouldAcceptDrop"
          :get-child-payload="getCardPayload('bottom')">
          <Draggable v-for="wire in wires.bottom" :key="wire.id">
            <Wire type="bottom" v-model="wire.label" @input="emitModelUpdate" />
          </Draggable>
        </Container>
      </div>
    </div>
    <div class="ic__col">
      <div>
        <Container
          orientation="vertical"
          @drop="(e) => onWireDrop('right', e)"
          @drag-enter="setActiveOrientation('right')"
          @drag-leave="removeActiveOrientation('right')"
          :get-child-payload="getCardPayload('right')"
          :should-accept-drop="shouldAcceptDrop"
          class="ic__wire-container ic__wire-container--right">
          <Draggable v-for="wire in wires.right" :key="wire.id">
            <Wire type="right" v-model="wire.label" @input="emitModelUpdate" />
          </Draggable>
        </Container>
      </div>
    </div>
  </Container>
</template>

<script>
import { cloneDeep } from 'lodash'
import { Container, Draggable } from 'vue-smooth-dnd'
import Wire from './Wire'

const applyDrag = (arr, dragResult) => {
  const { removedIndex, addedIndex, payload } = dragResult
  if (removedIndex === null && addedIndex === null) return arr

  const result = Object.values(arr)
  let itemToAdd = payload

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0]
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd)
  }

  return result.filter(a => a)
}


export default {
  name: 'Cards',

  components: {Container, Draggable, Wire},

  props: {
    value: {
      type: Object,
      default: () => {
        return {
          top: [],
          left: [],
          bottom: [],
          right: []
        }
      }
    }
  },

  data () {
    return {
      title: 'Test Circuit Very longname',
      editing: false,
      isDragging: false,
      activeItem: null,
      activeOrientation: 'none'
    }
  },

  computed: {
    wires () {
      return cloneDeep(this.value)
    },
    isTitleVertical () {
      const count = type => this.wires[type].length

      return Math.max(count('left'), count('right'))
        < Math.max(count('top'), count('bottom'))
    },
    style () {
      const size = `${this.title.length * 16}px`

      if (this.isTitleVertical) {
        return {
          minHeight: size,
          paddingTop: '20px'
        }
      }
        return {
          minWidth: size,
          paddingBottom: '20px'
      }
    }
  },

  methods: {
    startEditing () {
      this.editing = true
      this.$nextTick(() => this.$refs.textbox.select())
    },

    stopEditing () {
      this.editing = false
      this.emitModelUpdate()
    },

    onWireDrop (location, dropResult) {
      const newWires = [...this.wires[location]]

      this.wires[location] = applyDrag(newWires, dropResult)
      this.emitModelUpdate()
    },

    emitModelUpdate () {
      console.log('will emit: ', this.wires)
      this.$emit('input', this.wires)
    },

    getCardPayload (location) {
      return index => {
        return this.wires[location][index]
      }
    },

    dragStart ({ payload }) {
      this.isDragging = true
      this.setActiveItemClass()
    },

    dragEnd () {
      this.isDragging = false
    },

    setActiveItemClass () {
      const item = document.querySelector('.smooth-dnd-ghost')

      if (item) {
        item.querySelector('div').className = `wire wire--${this.activeOrientation}`
      }
    },

    setActiveOrientation (orientation) {
      this.activeOrientation = orientation
      this.setActiveItemClass(this.activeOrientation)
    },

    removeActiveOrientation (orientation) {
      if (this.activeOrientation === orientation) {
        this.activeOrientation = 'node'
        this.setActiveItemClass(this.activeOrientation)
      }
    },

    shouldAcceptDrop (...args) {
      console.log('args: ', args[1])

      // return !!args[1]
      return true
    }
  }
}
</script>

<style lang="scss">
$port-size: 30px;
$port-radius: 12px;
$port-width: 30px;
$min-dimension: 100px;
$stroke-width: 1px;
$stroke-color: $color-primary;
$bg-color: $color-bg-primary;

.ic {
  display: flex;

  &--dragging {
    .ic__wire-container:hover {
      background-color: rgba(186, 212, 255, 0.5);
    }
  }

  &__textbox {
    font-family: "Lucida Console", Monaco, monospace;
    font-size: 12px;
    text-align: center;
    width: 100%;
    padding: 0;
    color: $color-primary;
    margin: 0;
    border: 0;
    background-color: transparent;
    outline: none;
    box-sizing: border-box;
  }

  &__textbox:not(.ic__textbox--edit) {
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  &__col {
    display: flex;
    min-height: $min-dimension;

    &--center {
      flex-direction: column;
    }
  }

  &__wire-container {
    box-sizing: border-box;
    display: flex;
    justify-content: center;

    &--left, &--right {
      width: $port-size;
      min-height: calc(100% - #{$port-width * 2});
      margin: $port-size 0;
      flex-direction: column;
    }

    &--top, &--bottom {
      height: $port-size;
      width: 100%;
      padding: 0 $port-width;
      display: flex !important;
      align-items: center;
    }

    & > div {
      overflow: visible !important;
    }
  }

  &__center {
    display: flex;
    font-size: 12px;
    font-family: "Lucida Console", Monaco, monospace;
    justify-content: center;
    align-items: center;
    flex: 1;
    border: $stroke-width solid $stroke-color;
    background-color: $bg-color;
    color: $color-primary;
    min-width: $min-dimension;
    box-sizing: border-box;
    // min-height: $min-dimension;
  }

  &__title {
    width: 100%;

    &--vertical {
      transform: rotate(90deg);
    }
  }
}
</style>
