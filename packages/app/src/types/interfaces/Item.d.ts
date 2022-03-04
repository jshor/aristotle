declare global {
  interface Item extends BaseItem {
    type: string // TODO: should be enum
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
      items: {
        [id: string]: Item
      },
      connections: {
        [id: string]: Connection
      },
      ports: {
        [id: string]: Port
      }
    }
  }
}

export default Item
