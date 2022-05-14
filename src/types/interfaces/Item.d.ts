import DocumentState from '@/store/DocumentState'
import ItemSubtype from '../enums/ItemSubtype'
import ItemType from '../enums/ItemType'

declare global {
  interface Item extends BaseItem {
    type: ItemType
    subtype: string
    name: string
    portIds: string[]
    groupId: string | null
    rotation: number
    boundingBox: BoundingBox
    position: Point
    zIndex: number
    width: number
    height: number
    properties: {
      [propertyName: string]: Property
    }
    integratedCircuit?: {
      items: Record<string, Item>
      connections: Record<string, Connection>
      ports: Record<string, Port>
      groups: Record<string, Group>
      serializedState: string
    }
  }
}

export default Item
