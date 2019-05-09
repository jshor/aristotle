<template>
  <toolbox
    v-if="activeDocument"
    :data-target="activeDocument.id">
    <toolbox-group heading="Gates">
      <toolbox-item
        type="LogicGate"
        subtype="NOR"
        caption="NOR"
        :src="buffer"
        :width="100"
        :zoom-factor="activeDocument.zoomFactor"
      />
    </toolbox-group>
    <toolbox-group heading="Buffers">
    </toolbox-group>
  </toolbox>
</template>

<script>
import { mapGetters } from 'vuex'
import { renderGate } from '@aristotle/logic-gates'
import Toolbox from '@/components/Toolbox'
import ToolboxItem from '@/components/ToolboxItem'
import ToolboxGroup from '@/components/ToolboxGroup'

export default {
  name: 'ToolboxContainer',
  components: {
    Toolbox,
    ToolboxItem,
    ToolboxGroup
  },
  data () {
    return {
      buffer: renderGate('NOR', 2, '#000').path
    }
  },
  computed: {
    ...mapGetters(['activeDocument'])
  }
}
</script>
