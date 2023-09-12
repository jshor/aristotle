import Point from '@/types/interfaces/Point'
import BoundingBox from '../types/BoundingBox'
import BaseItem from './BaseItem'

interface Group extends BaseItem {
  id: string
  itemIds: string[]
  connectionIds: string[]
  boundingBox: BoundingBox
  position: Point
}

export default Group
