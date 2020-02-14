<template>
  <div :class="`wire wire--${type}`">
    <div class="wire__port"></div>
    <div class="wire__line"></div>
    <input
      v-if="editing"
      @blur="stopEditing"
      :value="value"
      ref="textbox"
      type="text"
      class="wire__label wire__label--edit"
      maxlength="3"
    />
    <div
      v-else
      @click="startEditing"
      class="wire__label">
      {{ value }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Wire',
  props: {
    type: {
      type: String,
      default: 'node'
    },
    value: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      editing: false
    }
  },
  methods: {
    startEditing () {
      this.editing = true
      this.$nextTick(() => this.$refs.textbox.select())

    },
    stopEditing () {
      this.editing = false
      this.$emit('input', this.$refs.textbox.value)
    }
  }
}
</script>

<style lang="scss">
$port-size: 30px;
$port-radius: 12px;
$port-width: 30px;
$min-dimension: 100px;
$label-padding: 5px;
$stroke-width: 2px;
$stroke-color: $color-primary;
$bg-color: $color-bg-primary;

.wire {
  position: relative;
  cursor: move;

  &__port {
    position: absolute;
    border: $stroke-width solid $bg-color;
    border-radius: 50%;
    width: $port-radius;
    height: $port-radius;
    box-sizing: border-box;
    background-color: $stroke-color;
    z-index: 2;
  }

  &__line {
    position: absolute;
    background-color: $stroke-color;
  }

  &__label {
    position: absolute;
    font-family: "Lucida Console", Monaco, monospace;
    text-align: center;
    width: $port-width;
    padding: 0 $label-padding;
    color: $color-primary;
    font-size: 12px;
    margin: 0;
    border: 0;
    background-color: transparent;
    outline: none;
    box-sizing: border-box;
    z-index: 800;
  }

  &__label:not(.wire__label--edit) {
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  &--left, &--right {
    height: $port-width;
    width: 100%;

    .wire__port {
      top: $port-width / 2 - $port-radius / 2;
    }

    .wire__label {
      top: $port-width / 2 - $port-width / 4;
      box-sizing: border-box;
    }

    .wire__line {
      height: $stroke-width;
      width: $port-size;
      top: $port-width / 2 - $stroke-width / 2;
    }
  }

  &--left {
    .wire__label {
      left: $port-size;
      text-align: left;
    }
  }

  &--right {
    .wire__port {
      left: $port-size - $port-radius;
    }

    .wire__label {
      left: -$port-size;
      text-align: right;
    }
  }

  &--top, &--bottom {
    width: $port-width;

    .wire__port {
      left: $port-width / 2 - $port-radius / 2;
    }

    .wire__line {
      width: $stroke-width;
      height: $port-size;
      margin: auto;
      left: $port-width / 2 - $stroke-width / 2;
      text-align:center;
    }

    .wire__label {
      padding: $label-padding 0;
    }
  }

  &--top {
    .wire__label {
      top: $port-size;
    }
  }

  &--bottom {
    .wire__port {
      top: $port-size - $port-radius;
    }

    .wire__label {
      top: -$port-width / 2 - $port-radius;
    }
  }

  &--node {
    .wire__line,
    .wire__label {
      visibility: hidden;
    }
  }
}
</style>
