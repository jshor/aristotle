<template>
  <div
    class="properties"
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
      <input
        v-model="values[key]"
        :type="data.type"
        :value="data.value"
        @input="change(key)"
        class="properties__field__input"
      >
    </div>
  </div>
</template>

<script>
export default {
  name: 'properties',
  computed: {
    style () {
      return {
        left: `${this.settings.position.x}px`,
        top: `${this.settings.position.y}px`
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

    return { values }
  },
  methods: {
    change (key) {
      this.$emit('change', { [key]: this.values[key] })
    },
    close () {
      this.$emit('close')
    }
  }
}
</script>

<style>
.properties {
  position: absolute;
  background-color: #fff;
  border: 1px solid #000;
  width: 150px;
  padding: 0.5em;
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
