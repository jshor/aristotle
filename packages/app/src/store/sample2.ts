import PortType from "@/types/enums/PortType"

export default {

  connections: {
    switch1_nor1_conn: {
      id: 'switch1_nor1_conn',
      connectionChainId: 'switch1_nor1_conn',
      source: 'switchOutputPort1',
      target: 'nor1InputPort1',
      trueTargetId: 'nor1InputPort1',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    switch2_nor2_conn: {
      id: 'switch2_nor2_conn',
      connectionChainId: 'switch2_nor2_conn',
      source: 'switchOutputPort2',
      target: 'nor2InputPort1',
      trueTargetId: 'nor2InputPort1',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    nor1_nor2_conn: {
      id: 'nor1_nor2_conn',
      connectionChainId: 'nor1_nor2_conn',
      source: 'nor1OutputPort1',
      target: 'nor2InputPort2',
      trueTargetId: 'nor2InputPort2',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    nor2_nor1_conn: {
      id: 'nor2_nor1_conn',
      connectionChainId: 'nor2_nor1_conn',
      source: 'nor2OutputPort1',
      target: 'nor1InputPort2',
      trueTargetId: 'nor1InputPort2',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    nor1_lightbulb1_conn: {
      id: 'nor1_lightbulb1_conn',
      connectionChainId: 'nor1_lightbulb1_conn',
      source: 'nor1OutputPort1',
      target: 'lightbulbInputPort1',
      trueTargetId: 'lightbulbInputPort1',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    nor2_lightbulb2_conn: {
      id: 'nor2_lightbulb2_conn',
      connectionChainId: 'nor2_lightbulb2_conn',
      source: 'nor2OutputPort1',
      target: 'lightbulbInputPort2',
      trueTargetId: 'lightbulbInputPort2',
      isSelected: false,
      groupId: null,
      zIndex: 5
    }
  },
  ports: {
    nor1InputPort1: {
      id: 'nor1InputPort1',
      elementId: 'nor1',
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
    nor1InputPort2: {
      id: 'nor1InputPort2',
      elementId: 'nor1',
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
    nor1OutputPort1: {
      id: 'nor1OutputPort1',
      elementId: 'nor1',
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
    nor2InputPort1: {
      id: 'nor2InputPort1',
      elementId: 'nor2',
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
    nor2InputPort2: {
      id: 'nor2InputPort2',
      elementId: 'nor2',
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
    nor2OutputPort1: {
      id: 'nor2OutputPort1',
      elementId: 'nor2',
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
    switchOutputPort1: {
      id: 'switchOutputPort1',
      elementId: 'switch1',
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
    switchOutputPort2: {
      id: 'switchOutputPort2',
      elementId: 'switch2',
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
    lightbulbInputPort1: {
      id: 'lightbulbInputPort1',
      elementId: 'lightbulb1',
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
    lightbulbInputPort2: {
      id: 'lightbulbInputPort2',
      elementId: 'lightbulb2',
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
    nor1: {
      id: 'nor1',
      type: 'LogicGate',
      portIds: ['nor1InputPort1', 'nor1InputPort2', 'nor1OutputPort1'],
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
        inputCount: {
          label: 'Input count',
          value: 2,
          type: 'number',
          min: 2
        },
        showInOscilloscope: {
          label: 'Show in oscilloscope',
          value: false,
          type: 'boolean'
        }
      },
      groupId: null,
      zIndex: 0,
      width: 100,
      height: 150
    },
    nor2: {
      id: 'nor2',
      type: 'LogicGate',
      portIds: ['nor2InputPort2', 'nor2InputPort1', 'nor2OutputPort1'],
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
        inputCount: {
          label: 'Input count',
          value: 2,
          type: 'number',
          min: 2
        },
        showInOscilloscope: {
          label: 'Show in oscilloscope',
          value: false,
          type: 'boolean'
        }
      },
      groupId: null,
      zIndex: 1,
      width: 120,
      height: 51
    },
    switch1: {
      id: 'switch1',
      type: 'Clock',
      portIds: ['switchOutputPort1'],
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
        name: {
          label: 'Name',
          value: '',
          type: 'text'
        },
        startValue: {
          label: 'Start value',
          value: -1,
          type: 'number',
          options: {
            'True': 1,
            'Hi-Z': 0,
            'False': -1
          }
        },
        showInOscilloscope: {
          label: 'Show in oscilloscope',
          value: false,
          type: 'boolean'
        }
      },
      groupId: null,
      zIndex: 2,
      width: 40,
      height: 40
    },
    switch2: {
      id: 'switch2',
      type: 'InputNode',
      portIds: ['switchOutputPort2'],
      position: { x: 100, y: 500 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      properties: {
        name: {
          label: 'Name',
          value: '',
          type: 'text'
        },
        startValue: {
          label: 'Start value',
          value: -1,
          type: 'number',
          options: {
            'True': 1,
            'Hi-Z': 0,
            'False': -1
          }
        },
        showInOscilloscope: {
          label: 'Show in oscilloscope',
          value: false,
          type: 'boolean'
        }
      },
      groupId: null,
      zIndex: 3,
      width: 40,
      height: 40
    },
    lightbulb1: {
      id: 'lightbulb1',
      type: 'OutputNode',
      portIds: ['lightbulbInputPort1'],
      position: { x: 700, y: 300 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      properties: {
        name: {
          label: 'Name',
          value: '',
          type: 'text'
        },
        showInOscilloscope: {
          label: 'Show in oscilloscope',
          value: false,
          type: 'boolean'
        }
      },
      groupId: null,
      zIndex: 3,
      width: 40,
      height: 40
    },
    lightbulb2: {
      id: 'lightbulb2',
      type: 'OutputNode',
      portIds: ['lightbulbInputPort2'],
      position: { x: 700, y: 500 },
      boundingBox: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      rotation: 0,
      isSelected: false,
      properties: {
        name: {
          label: 'Name',
          value: '',
          type: 'text'
        },
        showInOscilloscope: {
          label: 'Show in oscilloscope',
          value: false,
          type: 'boolean'
        }
      },
      groupId: null,
      zIndex: 3,
      width: 40,
      height: 40
    }
  }
}
