import { v4 as uuid } from 'uuid'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import itemFactory from './itemFactory'
import portFactory from './portFactory'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import ItemProperties from '@/types/interfaces/ItemProperties'
import ItemFactory from '@/types/types/ItemFactory'
import Port from '@/types/interfaces/Port'

const inputFactory: ItemFactory = (type: ItemSubtype, width: number, height: number, properties: ItemProperties = {}) => {
  const elementId = uuid()
  const ports: Record<Direction, Port[]> = {
    [Direction.Left]: [],
    [Direction.Top]: [],
    [Direction.Bottom]: [],
    [Direction.Right]: [
      portFactory(elementId, uuid(), Direction.Right, PortType.Output, 'Output Port')
    ]
  }
  const item = itemFactory(elementId, ItemType.InputNode, type, width, height, ports)

  item.properties = {
    ...item.properties,
    ...properties,
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
  }

  return { item, ports }
}

export default inputFactory
