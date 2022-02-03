import PortType from "@/types/enums/PortType";
import sampleIc from "./sampleIc";

export default {
  connections: {
    switch1_conn: {
      id: 'switch1_conn',
      source: 'inputPort1',
      target: 'nor1InputPort1',
      trueTargetId: 'nor1InputPort1',
      isSelected: false,
      groupId: null,
      zIndex: 5
    }
  },
  ports: {
    nor1OutputPort1: {
      id: 'nor1OutputPort1',
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
    nor2OutputPort1: {
      id: 'nor2OutputPort1',
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
    inputPort1: {
      id: 'inputPort1',
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
    inputPort2: {
      id: 'inputPort2',
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
    outputPort1: {
      id: 'outputPort1',
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
    outputPort2: {
      id: 'outputPort2',
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



    inputPort1: {
      id: 'inputPort1',
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
    inputPort2: {
      id: 'inputPort2',
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
    outputPort1: {
      id: 'outputPort1',
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
    outputPort2: {
      id: 'outputPort2',
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
    ic: {
      id: 'ic',
      type: 'IntegratedCircuit',
      portIds: ['ic_inputPort1', 'ic_inputPort2', 'ic_outputPort1', 'ic_outputPort2'],
      position: { x: 350, y: 400 },
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
    switch1: {
      id: 'switch1',
      type: 'CircuitNode',
      portIds: ['inputPort1'],
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
    switch2: {
      id: 'switch2',
      type: 'CircuitNode',
      portIds: ['inputPort2'],
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
    lightbulb1: {
      id: 'lightbulb1',
      type: 'CircuitNode',
      portIds: ['outputPort1'],
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
    lightbulb2: {
      id: 'lightbulb2',
      type: 'CircuitNode',
      portIds: ['outputPort2'],
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
