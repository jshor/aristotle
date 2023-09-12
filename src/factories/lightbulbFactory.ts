import { v4 as uuid } from 'uuid'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import itemFactory from './itemFactory'
import portFactory from './portFactory'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import Port from '@/types/interfaces/Port'

export default function lightbulbFactory () {
  const elementId = uuid()
  const ports: Record<Direction, Port[]> = {
    [Direction.Left]: [
      portFactory(elementId, uuid(), Direction.Left, PortType.Input, 'Input Port')
    ],
    [Direction.Top]: [],
    [Direction.Bottom]: [],
    [Direction.Right]: []
  }
  const item = itemFactory(elementId, ItemType.OutputNode, ItemSubtype.Lightbulb, 40, 40, ports)

  return { item, ports }
}
