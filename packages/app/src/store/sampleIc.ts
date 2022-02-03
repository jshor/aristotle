import PortType from "@/types/enums/PortType";


// TODO: NOTE: when saving an IC, (1) the ports of all input nodes (switches, etc.) must be converted from output ports to input ports
// those port ids must be the same as the ones as the input ports defined in the IntegratedCircuit type for node as well, (2):
// the input ports of output nodes (lightbulbs, etc.) must be converted to output ports and also must match the ones defined in IntegratedCircuit,
// and (3) output nodes and input nodes must be converted to the generic

export default {
  connections: {
    ic_switch1_nor1_conn: {
      id: 'ic_switch1_nor1_conn',
      source: 'ic_inputPort1',
      target: 'ic_nor1InputPort1',
      trueTargetId: 'ic_nor1InputPort1',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    ic_switch2_nor2_conn: {
      id: 'ic_switch2_nor2_conn',
      source: 'ic_inputPort2',
      target: 'ic_nor2InputPort1',
      trueTargetId: 'ic_nor2InputPort1',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    ic_nor1_nor2_conn: {
      id: 'ic_nor1_nor2_conn',
      source: 'ic_nor1OutputPort1',
      target: 'ic_nor2InputPort2',
      trueTargetId: 'ic_nor2InputPort2',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    ic_nor2_nor1_conn: {
      id: 'ic_nor2_nor1_conn',
      source: 'ic_nor2OutputPort1',
      target: 'ic_nor1InputPort2',
      trueTargetId: 'ic_nor1InputPort2',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    ic_nor1_lightbulb1_conn: {
      id: 'ic_nor1_lightbulb1_conn',
      source: 'ic_nor1OutputPort1',
      target: 'ic_outputPort1',
      trueTargetId: 'ic_outputPort1',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    ic_nor2_lightbulb2_conn: {
      id: 'ic_nor2_lightbulb2_conn',
      source: 'ic_nor2OutputPort1',
      target: 'ic_outputPort2',
      trueTargetId: 'ic_outputPort2',
      isSelected: false,
      groupId: null,
      zIndex: 5
    }
  },
  ports: {
    ic_nor1InputPort1: {
      id: 'ic_nor1InputPort1',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Input,
      rotation: 0,
      orientation: 0,
      value: 0,
      isFreeport: false
    },
    ic_nor1InputPort2: {
      id: 'ic_nor1InputPort2',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Input,
      rotation: 0,
      orientation: 0,
      value: 0,
      isFreeport: false
    },
    ic_nor1OutputPort1: {
      id: 'ic_nor1OutputPort1',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Output,
      rotation: 0,
      orientation: 2,
      value: 0,
      isFreeport: false
    },
    ic_nor2InputPort1: {
      id: 'ic_nor2InputPort1',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Input,
      rotation: 0,
      orientation: 0,
      value: 0,
      isFreeport: false
    },
    ic_nor2InputPort2: {
      id: 'ic_nor2InputPort2',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Input,
      rotation: 0,
      orientation: 0,
      value: 0,
      isFreeport: false
    },
    ic_nor2OutputPort1: {
      id: 'ic_nor2OutputPort1',
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      rotation: 0,
      orientation: 2,
      value: 0,
      isFreeport: false
    },
    ic_inputPort1: {
      id: 'ic_inputPort1',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Output,
      rotation: 0,
      orientation: 2,
      value: 0,
      isFreeport: false
    },
    ic_inputPort2: {
      id: 'ic_inputPort2',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Output,
      rotation: 0,
      orientation: 2,
      value: 0,
      isFreeport: false
    },
    ic_outputPort1: {
      id: 'ic_outputPort1',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Input,
      rotation: 0,
      orientation: 0,
      value: 0,
      isFreeport: false
    },
    ic_outputPort2: {
      id: 'ic_outputPort2',
      position: {
        x: 0,
        y: 0
      },
      type: PortType.Input,
      rotation: 0,
      orientation: 0,
      value: 0,
      isFreeport: false
    }
  },
  items: {
    ic_nor1: {
      id: 'ic_nor1',
      type: 'LogicGate',
      portIds: ['ic_nor1InputPort1', 'ic_nor1InputPort2', 'ic_nor1OutputPort1'],
      position: { x: 300, y: 300 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      },
      groupId: null,
      zIndex: 0,
      width: 100,
      height: 150
    },
    ic_nor2: {
      id: 'ic_nor2',
      type: 'LogicGate',
      portIds: ['ic_nor2InputPort2', 'ic_nor2InputPort1', 'ic_nor2OutputPort1'],
      position: { x: 300, y: 500 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      },
      groupId: null,
      zIndex: 1,
      width: 120,
      height: 51
    },
    ic_switch1: {
      id: 'ic_switch1',
      type: 'CircuitNode',
      portIds: ['ic_inputPort1'],
      position: { x: 100, y: 300 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      },
      groupId: null,
      zIndex: 2,
      width: 40,
      height: 40
    },
    ic_switch2: {
      id: 'ic_switch2',
      type: 'CircuitNode',
      portIds: ['ic_inputPort2'],
      position: { x: 100, y: 500 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      groupId: null,
      zIndex: 3,
      width: 40,
      height: 40
    },
    ic_lightbulb1: {
      id: 'ic_lightbulb1',
      type: 'CircuitNode',
      portIds: ['ic_outputPort1'],
      position: { x: 700, y: 300 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      groupId: null,
      zIndex: 3,
      width: 40,
      height: 40
    },
    ic_lightbulb2: {
      id: 'ic_lightbulb2',
      type: 'CircuitNode',
      portIds: ['ic_outputPort2'],
      position: { x: 700, y: 500 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      groupId: null,
      zIndex: 3,
      width: 40,
      height: 40
    }
  }
}
