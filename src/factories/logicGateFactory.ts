import { v4 as uuid } from 'uuid'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import itemFactory from './itemFactory'
import portFactory from './portFactory'
import Direction from '@/types/enums/Direction'
import Port from '@/types/interfaces/Port'
import PortType from '@/types/enums/PortType'
import { t } from '@/utils/i18n'

export default function logicGateFactory (type: ItemSubtype, inputCount = 2) {
  const elementId = uuid()
  const ports: Record<Direction, Port[]> = {
    [Direction.Top]: [],
    [Direction.Left]: Array(inputCount)
      .fill('')
      .map(() => portFactory(elementId, uuid(), Direction.Left, PortType.Input)),
    [Direction.Bottom]: [],
    [Direction.Right]: [
      portFactory(elementId, uuid(), Direction.Right, PortType.Output)
    ]
  }
  const item = itemFactory(elementId, ItemType.LogicGate, type, ports)

  item.properties = {
    ...item.properties,
    inputCount: {
      label: t('propertyName.inputCount'),
      value: inputCount,
      type: 'number',
      min: inputCount
    }
  }

  return { item, ports }
}
