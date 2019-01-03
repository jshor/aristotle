import uuid from '@/utils/uuid'

const R = uuid()
const S = uuid()
const NOR_1 = uuid()
const NOR_2 = uuid()
const NOR_3 = uuid()
const OUT_1 = uuid()
const OUT_2 = uuid()

const data = {
  nodes: [
    {
      id: R,
      type: 'Switch',
      name: 'R',
      x: 0,
      y: 350
    },
    {
      id: S,
      type: 'Switch',
      name: 'S',
      x: 0,
      y: 450
    },
    {
      id: NOR_1,
      type: 'LogicGate',
      name: 'NOR_1',
      x: 200,
      y: 350
    },
    {
      id: NOR_2,
      type: 'LogicGate',
      name: 'NOR_2',
      x: 200,
      y: 450
    },
    {
      id: NOR_3,
      type: 'LogicGate',
      name: 'NOR_3',
      x: 400,
      y: 350
    },
    {
      id: OUT_1,
      type: 'Lightbulb',
      name: 'OUT_1',
      x: 400,
      y: 450
    },
    {
      id: OUT_2,
      type: 'Lightbulb',
      name: 'OUT_2',
      x: 400,
      y: 500
    }
  ],
  connections: [
    {
      inputId: NOR_1,
      outputId: NOR_2,
      outputPortIndex: 1
    },
    {
      inputId: S,
      outputId: NOR_2,
      outputPortIndex: 0
    },
    {
      inputId: NOR_2,
      outputId: NOR_1,
      outputPortIndex: 1
    },
    {
      inputId: R,
      outputId: NOR_1,
      outputPortIndex: 0
    },
    {
      inputId: NOR_1,
      outputId: OUT_1,
      outputPortIndex: 0
    },
    {
      inputId: NOR_2,
      outputId: OUT_2,
      outputPortIndex: 0
    }
  ]
}

console.log(JSON.stringify(data))

export default data
