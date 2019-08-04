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
      v-for="(data, key, index) in settings.settings"
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

<script>
export default {
  name: 'properties',
  computed: {
    style () {
      return {
        left: `${this.settings.position.x - this.offsetX}px`,
        top: `${this.settings.position.y - this.offsetY}px`
      }
    }
  },
  props: {
    settings: {
      type: Object,
      required: true
    }
  },
  data () {
    const { settings } = this.settings
    const values = {}

    for (let key in settings) {
      values[key] = settings[key].value
    }

    return {
      values,
      offsetX: 0,
      offsetY: 0
    }
  },
  mounted () {
    this.adjustToFitViewport()
  },
  methods: {
    change (key) {
      this.$emit('change', {
        elementId: this.settings.elementId,
        data: {
          [key]: this.values[key]
        }
      })
    },
    close () {
      this.$emit('close')
    },
    adjustToFitViewport () {
      const container = this.$refs.properties
      const containerRect = container.getBoundingClientRect()
      const parentRect = container.parentNode.getBoundingClientRect()

      if (containerRect.right > parentRect.right) {
        this.offsetX = containerRect.right - parentRect.right
      }

      if (containerRect.bottom > parentRect.bottom) {
        this.offsetY = containerRect.bottom - parentRect.bottom
      }
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
