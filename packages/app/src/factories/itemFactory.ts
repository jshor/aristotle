import ItemType from '@/types/enums/ItemType'
import { v4 as uuid } from 'uuid'

export default function itemFactory (type: ItemType, subtype: string, portIds: string[] = [], properties: Record<string, Property> = {}): Item {
  return {
    id: uuid(),
    name: '',
    type,
    subtype,
    portIds: [],
    groupId: null,
    rotation: 0,
    boundingBox: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    position: {
      x: 0,
      y: 0
    },
    zIndex: 0,
    width: 0,
    height: 0,
    isSelected: false,
    properties
  }
}
