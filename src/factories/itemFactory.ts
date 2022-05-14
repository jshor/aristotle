import ItemType from '@/types/enums/ItemType'

export default function itemFactory (id: string, type: ItemType, subtype: string, width: number, height: number, ports: Port[] = []): Item {
  return {
    id,
    name: '',
    type,
    subtype,
    portIds: ports.map(({ id }) => id),
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
    properties: {}
  }
}
