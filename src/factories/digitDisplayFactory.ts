import { v4 as uuid } from 'uuid'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import itemFactory from './itemFactory'
import portFactory from './portFactory'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import integratedCircuitFactory from './integratedCircuitFactory'
import Port from '@/types/interfaces/Port'
import SerializableState from '@/types/interfaces/SerializableState'

export default function digitFactory () {
  const ports: Record<Direction, Port[]> = {
    [Direction.Left]: [],
    [Direction.Right]: [],
    [Direction.Top]: [],
    [Direction.Bottom]: []
  }

  const state: SerializableState = Array(4)
    .fill('')
    .reduce((map, _, i) => {
      const portId = uuid()
      const itemId = uuid()
      const port = portFactory(itemId, portId, Direction.Left, PortType.Output)
      const item = itemFactory(itemId, ItemType.InputNode, ItemSubtype.Switch, {
        [Direction.Left]: [port],
        [Direction.Right]: [],
        [Direction.Top]: [],
        [Direction.Bottom]: []
      })

      ports[Direction.Left].push(port)

      return {
        connections: {},
        groups: {},
        items: {
          ...map.items,
          [itemId]: item
        },
        ports: {
          ...map.ports,
          [portId]: port
        }
      }
    }, {
      connections: {},
      ports: {},
      items: {},
      groups: {}
    })

  const { item } = integratedCircuitFactory(state, 'Digit Display', ItemSubtype.DigitDisplay)

  return { item, ports }
}
