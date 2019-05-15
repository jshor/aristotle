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
      <toolbox-item
        type="IntegratedCircuit"
        caption="R-S"
        :src="rsFlipFlop"
        :width="168"
        :zoom-factor="activeDocument.zoomFactor"
      />
      <toolbox-item
        type="Switch"
        caption="Switch"
        :src="switchSvg"
        :width="96"
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
import nor from '@/assets/elements/nor.svg'
import switchSvgeeeee from '@/assets/elements/switchSS.svg'
// import rsFlipFlop from '@/assets/elements/r-s-flip-flop.svg'

const theSwitch = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="74"><rect width="60" height="74" fill="#1C1D24" stroke="#ffffff" stroke-width="2" vector-effect="non-scaling-stroke"></rect><rect width="15" height="40" x="22" y="15" fill="#808080" rx="2" ry="2"></rect><rect width="24" height="12" x="18" y="48" stroke="#ffffff" stroke-width="1" vector-effect="non-scaling-stroke" rx="2" ry="2" fill="#1C1D24"></rect><line x1="60" x2="96" y1="37" y2="37" stroke="#ffffff" stroke-width="2"></line></svg>
`

const rsFlipFlop = `
<svg width="168" height="60" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, -30)">
    <svg x="30" y="30" width="108" height="60" transform="translate(30, 30)">
      <rect width="108" height="60" stroke="#ffffff" stroke-width="2" fill="#1C1D24" />
      <svg width="108" height="60">
        <text x="54" y="30" font-family="Lucida Console, Monaco, monospace" font-size="12" fill="#ffffff" text-anchor="middle" alignment-baseline="central">R-Sp</text>
      </svg>
    </svg>
    <line x1="0" x2="30" y1="45" y2="45" stroke-width="2" stroke="#ffffff" />
    <line x1="0" x2="30" y1="75" y2="75" stroke-width="2" stroke="#ffffff" />
    <line x1="138" x2="168" y1="45" y2="45" stroke-width="2" stroke="#ffffff" />
    <line x1="138" x2="168" y1="75" y2="75" stroke-width="2" stroke="#ffffff" />
    <text x="36" y="49" font-family="Lucida Console, Monaco, monospace" font-size="12" fill="#ffffff">R</text>
    <text x="36" y="79" font-family="Lucida Console, Monaco, monospace" font-size="12" fill="#ffffff">S</text>
    <text x="110.25" y="49" font-family="Lucida Console, Monaco, monospace" font-size="12" fill="#ffffff">Q</text>
    <text x="110.25" y="79" font-family="Lucida Console, Monaco, monospace" font-size="12" fill="#ffffff">Q'</text>
  </g>
</svg>
`

export default {
  name: 'ToolboxContainer',
  components: {
    Toolbox,
    ToolboxItem,
    ToolboxGroup
  },
  data () {
    const toSvg = (x) => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(x)))

console.log('svg: ', switchSvgeeeee)
    return {
      buffer: renderGate('NOR', 2, '#ffffff', '#000000').path,
      switchSvg: toSvg(theSwitch),
      rsFlipFlop: toSvg(rsFlipFlop)
    }
  },
  computed: {
    ...mapGetters(['activeDocument'])
  }
}
</script>
