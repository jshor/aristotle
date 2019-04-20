<template>
  <div>
    <img :src="buffer" class="draw2d_droppable ui-draggable" ref="svg" />
    Nor
  </div>
</template>

<script>
import { renderGate } from '@aristotle/logic-gates'

export default {
  name: 'Toolbox',
  data () {
    return {
      buffer: renderGate('NOR', 2, '#000').path
    }
  }
}
</script>