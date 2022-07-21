import { DocumentStore } from '@/store/document'
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
    integratedCircuit?: IntegratedCircuit
  }
}

export default Item