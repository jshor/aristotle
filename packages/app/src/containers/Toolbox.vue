<template>
  <div class="toolbox">
    <toolbox-item
      :right-port-count="1"
      :zoom="zoom"
      label="Toggle Switch"
      @drop="onDropSwitch"
    >
      <input-switch :value="-1" />
    </toolbox-item>

    <toolbox-item
      :right-port-count="1"
      :zoom="zoom"
      label="Clock"
      @drop="onDropClock"
    >
      <input-switch :value="-1" />
    </toolbox-item>

    <toolbox-item
      :left-port-count="1"
      :zoom="zoom"
      label="Lightbulb"
      @drop="onDropLightbulb"
    >
      <lightbulb :value="-1" />
    </toolbox-item>

    <toolbox-item
      v-for="(type, index) in [
        ItemSubtype.And,
        ItemSubtype.Nand,
        ItemSubtype.Xnor,
        ItemSubtype.Xor,
        ItemSubtype.Nor,
        ItemSubtype.Or
      ]"
      :key="index"
      :left-port-count="2"
      :right-port-count="1"
      :zoom="zoom"
      :label="type"
      @drop="position => onDropLogicGate(type, position)"
    >
      <logic-gate
        :input-count="2"
        :type="type"
      />
    </toolbox-item>
  </div>
</template>

<script lang="ts">
import { StoreDefinition } from 'pinia'
import { defineComponent, PropType, computed } from 'vue'
import DocumentState from '@/store/DocumentState'
import InputSwitch from '@/components/item/elements/InputSwitch.vue'
import Lightbulb from '@/components/item/elements/Lightbulb.vue'
import LogicGate from '@/components/item/elements/LogicGate.vue'
import ToolboxItem from '@/components/toolbox/ToolboxItem.vue'
import ItemSubtype from '@/types/enums/ItemSubtype'
import clockFactory from '@/factories/clockFactory'
import inputFactory from '@/factories/inputFactory'
import lightbulbFactory from '@/factories/lightbulbFactory'
import logicGateFactory from '@/factories/logicGateFactory'

export default defineComponent({
  name: 'Toolbox',
  components: {
    InputSwitch,
    Lightbulb,
    LogicGate,
    ToolboxItem
  },
  props: {
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const zoom = computed(() => store.zoom)

    function onDropLightbulb (position?: Point) {
      store.insertItem(lightbulbFactory(), position)
    }

    function onDropSwitch (position?: Point) {
      store.insertItem(inputFactory(ItemSubtype.Switch, 60, 60), position)
    }

    function onDropClock (position?: Point) {
      store.insertItem(clockFactory(), position)
    }

    function onDropLogicGate (type: ItemSubtype, position?: Point) {
      const { item, ports } = logicGateFactory(type, 140, 50)

      store.insertItem({ item, ports }, position)
    }

    return {
      ItemSubtype,
      onDropLightbulb,
      onDropSwitch,
      onDropClock,
      onDropLogicGate,
      zoom
    }
  }
})
</script>

<style lang="scss">
.toolbox {
  overflow-y: auto;
  max-height: 100%;
}
</style>
