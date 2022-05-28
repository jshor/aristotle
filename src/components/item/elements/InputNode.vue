<template>
  <div class="input-node">
    <button
      type="button"
      class="input-node__flipper"
      :tabindex="0"
      :class="{
        'input-node__flipper--on': model === 1,
        'input-node__flipper--off': model === -1,
        'input-node__flipper--high-z': model === 0
      }"
      @mousedown.stop="onInput"
    >
      <span v-if="model === 1">ON</span>
      <span v-else-if="model === -1">OFF</span>
      <span v-else>?</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watchEffect } from 'vue'
import ItemSubtype from '@/types/enums/ItemSubtype'

export default defineComponent({
  name: 'InputNode',
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    },
    // subtype: {
    //   type: String as PropType<ItemSubtype>,
    //   required: true
    // }
  },
  setup (props, { emit }) {
    const model = ref(0)

    watchEffect(() => {
      model.value = props.ports[0]?.value || 0
    })

    function onInput ($event: MouseEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      model.value = model.value === 1 ? -1 : 1

      emit('toggle', {
        id: props.ports[0].id,
        value: model.value
      })
    }

    return {
      model,
      onInput
    }
  }
})
</script>

<style lang="scss">
.input-node {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-secondary);
  background-color: var(--color-bg-secondary);
  pointer-events: all;
  box-sizing: border-box;
  cursor: move;

  &__flipper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    cursor: pointer;
    border: 1px solid var(--color-secondary);
    color: #fff;
    box-sizing: border-box;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.75em;
    border-radius: 2px;

    &--on {
      background-color: var(--color-on);
      box-shadow: 0 0 20px var(--color-on);
    }

    &--off {
      background-color: var(--color-off);
    }

    &--high-z {
      background-color: var(--color-hi-z);
    }
  }
}
</style>
