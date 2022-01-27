export default {

  connections: {
    conn_1: {
      id: 'conn_1',
      source: 'b',
      target: 'fp1',
      trueTargetId: 'c',
      isSelected: false,
      groupId: null,
      zIndex: 5
    },
    conn_2: {
      id: 'conn_2',
      source: 'fp2',
      target: 'c',
      trueTargetId: 'c',
      isSelected: false,
      groupId: null,
      zIndex: 6
    }
  },
  zoomLevel: 1,
  ports: {
    a: {
      id: 'a',
      position: {
        x: 0,
        y: 0
      },
      type: 1, // 0 = output, 1 = input, 2 = freeport
      rotation: 0,
      orientation: 0, // [0, 1, 2, 3] = [left, top, right, bottom]
      isFreeport: false
    },
    b: {
      id: 'b',
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      rotation: 0,
      orientation: 2,
      isFreeport: false
    },
    c: {
      id: 'c',
      position: {
        x: 0,
        y: 0
      },
      type: 1,
      rotation: 1,
      orientation: 1,
      isFreeport: false
    },
    d: {
      id: 'd',
      position: {
        x: 0,
        y: 0
      },
      type: 1,
      rotation: 0,
      orientation: 3,
      isFreeport: false
    },
    fp1: {
      id: 'fp1',
      position: {
        x: 0,
        y: 0
      },
      type: 1,
      rotation: 0,
      orientation: 0,
      isFreeport: true
    },
    fp2: {
      id: 'fp2',
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      rotation: 0,
      orientation: 2,
      isFreeport: true
    }
  },
  groups: {},
  elements: {
    abc: {
      id: 'abc',
      type: 'Element',
      portIds: ['a', 'b'],
      position: { x: 300, y: 300 },
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
    def: {
      id: 'def',
      type: 'Element',
      portIds: ['d'],
      position: { x: 900, y: 900 },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      },
      groupId: null,
      zIndex: 1,
      width: 100,
      height: 150
    },
    ghi: {
      id: 'ghi',
      type: 'Element',
      portIds: ['c'],
      position: { x: 650, y: 650 },
      rotation: 1,
      isSelected: false,
      properties: {
        inputCount: 1
      },
      groupId: null,
      zIndex: 2,
      width: 100,
      height: 150
    },
    freeport1: {
      id: 'freeport1',
      type: 'Freeport',
      portIds: ['fp1', 'fp2'],
      position: { x: 500, y: 500 },
      rotation: 0,
      isSelected: false,
      groupId: null,
      zIndex: 3,
      width: 10,
      height: 10
    }
  }
}
