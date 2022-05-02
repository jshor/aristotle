import { v4 as uuid } from 'uuid'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import itemFactory from './itemFactory'
import portFactory from './portFactory'

export default function logicGateFactory (type: ItemSubtype, width: number, height: number) {
  const elementId = uuid()
  const ports = [
    portFactory(elementId, uuid(), 0, 1, 'Input Port 1'),
    portFactory(elementId, uuid(), 0, 1, 'Input Port 2'),
    portFactory(elementId, uuid(), 2, 0, 'Output Port')
  ]
  const item = itemFactory(elementId, ItemType.LogicGate, type, width, height, ports)

  item.properties = {
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
  }

  return { item, ports }
}
