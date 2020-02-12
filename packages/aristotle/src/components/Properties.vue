<template>
  <div
    class="properties"
    ref="properties"
    :style="style">
    <div class="properties__heading">
      <div class="properties__heading__text properties__heading__text--expand">Properties</div>
      <div
        @click="close"
        class="properties__heading__text">
        &times;
      </div>
    </div>
    <div
      v-for="(data, key, index) in properties"
      :key="index"
      class="properties__field">
      <label
        :for="index"
        class="properties__field__label">
        {{ key }}
      </label>
      <select
        v-if="data.type === 'select'"
        v-model="values[key]"
        @change="change(key)"
        class="properties__field__input">
        <option
          v-for="(value, key) in data.options"
          :key="key"
          :value="key">
          {{ value }}
        </option>
      </select>
      <input
        v-else
        v-model="values[key]"
        :type="data.type"
        :value="data.value"
        :step="data.step"
        :min="data.min"
        :max="data.max"
        @change="change(key)"
        class="properties__field__input"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Emit from '../../../../node_modules/vue-class-component/lib'

import {
  IElementProperties,
  ElementPropertyValues,
  Point
} from '@aristotle/editor'

@Component({
  name: 'Properties',
  props: {
    properties: {
      type: Object as () => IElementProperties,
      required: true
    },
    elementId: {
      type: String,
      required: true
    },
    position: {
      type: Object as () => Point,
      default: () => ({
        x: 0,
        y: 0
      })
    }
  }
})
export default class Properties extends Vue {
  public elementId: string

  public properties: IElementProperties

  public position: Point

  public offsetX: number = 0

  public offsetY: number = 0

  public values: ElementPropertyValues = {}

  public _events = {} // WTF. TODO.

  get style (): { left: string, top: string} {
    return {
      left: `${this.position.x - this.offsetX}px`,
      top: `${this.position.y - this.offsetY}px`
    }
  }

  mounted () {
    this.values = this.getElementPropertyValues()
    this.adjustToFitViewport()
    // this._events = {}
  }

  getElementPropertyValues = (): ElementPropertyValues => {
    return Object
      .keys(this.properties)
      .reduce((properties: ElementPropertyValues, key: string): ElementPropertyValues => ({
        ...properties,
        [key]: this.properties[key].value
      }), {})
  }

  change = (key: string): void => {
    this.$emit('change', {
      elementId: this.elementId,
      properties: this.values,
      position: this.position
    })
  }

  close = (): void => {
    this.$emit('close')
  }

  adjustToFitViewport = (): void => {
    const container = this.$refs.properties as HTMLElement
    const parent = container.parentNode as HTMLElement

    const containerRect = container.getBoundingClientRect()
    const parentRect = parent.getBoundingClientRect()

    if (containerRect.right > parentRect.right) {
      this.offsetX = containerRect.right - parentRect.right
    }

    if (containerRect.bottom > parentRect.bottom) {
      this.offsetY = containerRect.bottom - parentRect.bottom
    }
  }
}
</script>

<style>
.properties {
  position: absolute;
  background-color: #fff;
  border: 1px solid #000;
  width: 200px;
  padding: 0.5em;
  z-index: 1000;
}

.properties__field {
  display: flex;
  width: 100%;
}

.properties__field__label,
.properties__field__input {
  flex: 1;
  max-width: 50%;
}

.properties__heading {
  display: flex;
  width: 100%;
  border-bottom: 1px solid #000;
  margin-bottom: 0.5rem;
}

.properties__heading__text {
  font-size: 1.25em;
  font-weight: bold;
}

.properties__heading__text--expand {
  flex: 1;
}
</style>
