declare global {
  interface Group extends BaseItem {
    id: string
    itemIds: string[]
    connectionIds: string[]
    boundingBox: BoundingBox
    position: Point
  }
}

export default Group
