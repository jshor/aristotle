import { v4 as uuid } from 'uuid'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import itemFactory from './itemFactory'
import portFactory from './portFactory'

export default function logicGateFactory (type: ItemSubtype, width: number, height: number, inputCount: number = 2) {
  const elementId = uuid()
  const ports = Array(inputCount)
    .fill('')
    .map((a, i) => portFactory(elementId, uuid(), 0, 1, `Input Port ${i}`))
    .concat(portFactory(elementId, uuid(), 2, 0, 'Output Port'))
  const item = itemFactory(elementId, ItemType.LogicGate, type, width, height, ItemType.LogicGate, ports)

  item.properties = {
    ...item.properties,
    inputCount: {
      label: 'Input count',
      value: inputCount,
      type: 'number',
      min: inputCount
    },
    showInOscilloscope: {
      label: 'Show in oscilloscope',
      value: false,
      type: 'boolean'
    }
  }

  return { item, ports }
}
