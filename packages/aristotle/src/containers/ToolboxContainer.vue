<template>
  <toolbox
    v-if="activeDocument"
    :data-target="activeDocument.id">

    <toolbox-group heading="I/O Elements">
      <toolbox-item
        v-for="ioElement in ioElements"
        :key="ioElement.type"
        :type="ioElement.type"
        :caption="ioElement.type"
        :src="ioElement.svg.path"
        :width="ioElement.svg.width"
        :zoom-factor="activeDocument.zoomFactor"
      />
    </toolbox-group>

    <toolbox-group heading="Logic Gates">
      <toolbox-item
        v-for="logicGate in logicGates"
        :key="logicGate.subtype"
        type="LogicGate"
        :caption="logicGate.subtype"
        :subtype="logicGate.subtype"
        :src="logicGate.svg.path"
        :width="logicGate.svg.width"
        :zoom-factor="activeDocument.zoomFactor"
      />
    </toolbox-group>

    <toolbox-group heading="Integrated Circuits">
      <toolbox-item
        v-for="integratedCircuit in integratedCircuits"
        :key="integratedCircuit.id"
        type="IntegratedCircuit"
        :caption="integratedCircuit.caption"
        :src="integratedCircuit.svg.path"
        :width="integratedCircuit.svg.width"
        :zoom-factor="activeDocument.zoomFactor"
      />
    </toolbox-group>
  </toolbox>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  IntegratedCircuitSVG,
  LogicGateSVG,
  DigitSVG,
  TemplateSVG
  } from '@aristotle/editor'
import Toolbox from '@/components/Toolbox'
import ToolboxItem from '@/components/ToolboxItem'
import ToolboxGroup from '@/components/ToolboxGroup'
import integratedCircuits from '@/mocks/integratedCircuits.json'

export default {
  name: 'ToolboxContainer',
  components: {
    Toolbox,
    ToolboxItem,
    ToolboxGroup
  },
  data () {
    const colors = {
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24',
      valueColor: '#868686',
      outlineColor: '#ffffff',
      y: 48 
    }

    return {
      ioElements: ['Switch', 'Clock', 'Lightbulb'].map((element) => ({
        type: element,
        svg: (new TemplateSVG({
          ...colors,
          template: element.toLowerCase()
        })).getSvgData()
      })).concat({
        type: 'Digit',
        svg: (new DigitSVG({
          ...colors,
          chars: '0'
        })).getSvgData()
      }),
      logicGates: ['OR', 'AND', 'NOR', 'NAND', 'XOR', 'XNOR'].map((gateType) => ({
        subtype: gateType,
        svg: (new LogicGateSVG({
          ...colors,
          inputCount: 2,
          gateType
        })).getSvgData()
      })),
      integratedCircuits: integratedCircuits.map((integratedCircuit) => ({
        caption: integratedCircuit.name,
        params: integratedCircuit,
        svg: (new IntegratedCircuitSVG({
          ...colors,
          title: integratedCircuit.name,
          wires: integratedCircuit.ports
        })).getSvgData()
      }))
    }
  },
  computed: {
    ...mapGetters(['activeDocument'])
  }
}
</script>
