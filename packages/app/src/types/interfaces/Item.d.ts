declare global {
  interface Item extends BaseItem {
    type: string // TODO: should be enum
    portIds: string[]
    groupId: string | null
    rotation: number
    boundingBox: BoundingBox
    position: Point
    properties?: any
    zIndex: number
    width: number
    height: number
  }
}

export default Item
