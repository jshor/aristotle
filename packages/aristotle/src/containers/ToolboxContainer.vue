<template>
  <toolbox
    v-if="activeDocument"
    :data-target="activeDocument.id">
    <toolbox-group heading="Gates">
      <toolbox-item
        type="LogicGate"
        subtype="NOR"
        caption="NOR"
        :src="switchSvg"
        :width="100"
        :zoom-factor="activeDocument.zoomFactor"
      />
      <toolbox-item
        type="IntegratedCircuit"
        caption="R-S Flip-Flop"
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
      <toolbox-item
        type="Digit"
        caption="Digit"
        :src="digit"
        :width="86"
        :zoom-factor="activeDocument.zoomFactor"
      />
      <toolbox-item
        type="Clock"
        caption="Clock"
        :src="clock"
        :width="80"
        :zoom-factor="activeDocument.zoomFactor"
      />
    </toolbox-group>
    <toolbox-group heading="Buffers">
    </toolbox-group>
  </toolbox>
</template>

<script>
import { mapGetters } from 'vuex'
import Toolbox from '@/components/Toolbox'
import ToolboxItem from '@/components/ToolboxItem'
import ToolboxGroup from '@/components/ToolboxGroup'

// TODO: this is unacceptable -- must find a way to get webpack to load SVGs
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

const digit = `
<svg xmlns="http://www.w3.org/2000/svg" width="86" height="90">
  <g transform="scale(0.75)">
    <line x1="0" x2="40" y1="15" y2="15" stroke="#ffffff" stroke-width="3" />
    <line x1="0" x2="40" y1="42" y2="42" stroke="#ffffff" stroke-width="3" />
    <line x1="0" x2="40" y1="72" y2="72" stroke="#ffffff" stroke-width="3" />
    <line x1="0" x2="40" y1="100" y2="100" stroke="#ffffff" stroke-width="3" />
    <g transform="translate(40, 2)">
      <rect width="74" height="115" fill="#1C1D24" stroke="#ffffff" stroke-width="3" />
      <g transform="translate(10, 10)">
        <path fill="#71AC7C" d="M 8,10 L 12,14 L 12,42 L 8,46 L 4,42 L 4,14 L 8,10 z" />
        <path fill="#71AC7C" d="M 10,8 L 14,4 L 42,4 L 46,8 L 42,12 L 14,12 L 10,8 z" />
        <path fill="#71AC7C" d="M 48,10 L 52,14 L 52,42 L 48,46 L 44,42 L 44,14 L 48,10 z" />
        <path fill="#71AC7C" d="M 48,50 L 52,54 L 52,82 L 48,86 L 44,82 L 44,54 L 48,50 z" />
        <path fill="#71AC7C" d="M 10,88 L 14,84 L 42,84 L 46,88 L 42,92 L 14,92 L 10,88 z" />
        <path fill="#71AC7C" d="M 8,50 L 12,54 L 12,82 L 8,86 L 4,82 L 4,54 L 8,50 z" />
        <path fill="#262831" d="M 10,48 L 14,44 L 42,44 L 46,48 L 42,52 L 14,52 L 10,48 z" />
      </g>
    </g>
  </g>
</svg>
`

const clock = `
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="50">
  <rect stroke="#ffffff" fill="#1C1D24" stroke-width="2" width="50" height="50" />
  <line stroke="#ffffff" stroke-width="2" x1="50" x2="80" y1="25" y2="25" />
  <polyline stroke="#868686" stroke-width="4" points="5,25 15,25 15,15 25,15 25,35 35,35 35,25 45,25" />
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

    return {
      // buffer: renderGate('NOR', 2, '#ffffff', '#000000').path,
      switchSvg: toSvg(theSwitch),
      digit: toSvg(digit),
      clock: toSvg(clock),
      rsFlipFlop: toSvg(rsFlipFlop)
    }
  },
  computed: {
    ...mapGetters(['activeDocument'])
  }
}
</script>
