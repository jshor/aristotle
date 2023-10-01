import ItemSubtype from '../enums/ItemSubtype'
import ItemType from '../enums/ItemType'
import ClockPulse from '@/store/document/oscillator/ClockPulse'
import Point from '@/types/interfaces/Point'
import BoundingBox from '../types/BoundingBox'
import BaseItem from './BaseItem'
import IntegratedCircuit from './IntegratedCircuit'
import Property from './Property'
import LogicValue from '../enums/LogicValue'
import ItemProperties from './ItemProperties'

interface Item extends BaseItem {
  type: ItemType
  subtype: ItemSubtype
  name: string
  portIds: string[]
  groupId: string | null
  rotation: number
  boundingBox: BoundingBox
  position: Point
  zIndex: number
  width: number
  height: number
  properties: ItemProperties
  clock?: ClockPulse | null
  integratedCircuit?: IntegratedCircuit
}

export default Item
