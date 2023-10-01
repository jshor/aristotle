import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'
import Direction from '@/types/enums/Direction'

export default function itemFactory (id: string, type: ItemType, subtype: ItemSubtype, width: number, height: number, ports?: Record<Direction, Port[]>): Item {
  return {
    id,
    defaultName: '',
    type,
    subtype,
    portIds: Object
      .values(ports || {})
      .reduce((portIds, ports) => portIds.concat(ports.map(({ id }) => id)), [] as string[]),
    groupId: null,
    rotation: 0,
    boundingBox: {
      top: 0,
      left: 0,
      right: width,
      bottom: height
    },
    position: {
      x: 0,
      y: 0
    },
    zIndex: 0,
    width,
    height,
    isSelected: false,
    properties: {
      name: {
        type: 'text',
        label: 'Name',
        value: ''
      }
    }
  }
}
