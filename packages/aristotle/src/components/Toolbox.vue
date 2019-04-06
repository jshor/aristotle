<template>
  <div
    class="toolbox"
    :style="style">
    <div class="toolbox__heading">
      <div class="toolbox__heading__text toolbox__heading__text--expand">Settings</div>
      <div
        @click="close"
        class="toolbox__heading__text">
        &times;
      </div>
    </div>
    <div
      v-for="(data, key, index) in settings.settings"
      :key="index"
      class="toolbox__field">
      <label
        :for="index"
        class="toolbox__field__label">
        {{ key }}
      </label>
      <input
        v-model="values[key]"
        :type="data.type"
        :value="data.value"
        @input="change(key)"
        class="toolbox__field__input"
      >
    </div>
  </div>
</template>

<script>
export default {
  name: 'Toolbox',
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
      // console.log('values: ', this)
      this.$emit('change', { [key]: this.values[key] })
    },
    close () {
      this.$emit('close')
    }
  }
}
</script>

<style>
.toolbox {
  position: absolute;
  background-color: #fff;
  border: 1px solid #000;
  width: 150px;
  padding: 0.5em;
}

.toolbox__field {
  display: flex;
  width: 100%;
}

.toolbox__field__label,
.toolbox__field__input {
  flex: 1;
  max-width: 50%;
}

.toolbox__heading {
  display: flex;
  width: 100%;
  border-bottom: 1px solid #000;
  margin-bottom: 0.5rem;
}

.toolbox__heading__text {
  font-size: 1.25em;
  font-weight: bold;
}

.toolbox__heading__text--expand {
  flex: 1;
}
</style>