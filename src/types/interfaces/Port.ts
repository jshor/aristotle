import BinaryWavePulse from '@/store/document/oscillator/BinaryWavePulse'
import PortType from '../enums/PortType'
import Direction from '../enums/Direction'
import Point from './Point'

interface Port {
  id: string
  name: string
  elementId: string
  virtualElementId?: string
  position: Point
  type: PortType
  rotation: number
  orientation: Direction
  value: number
  hue: number
  isFreeport: boolean
  isMonitored: boolean
  connectedPortIds: string[]
  wave?: BinaryWavePulse
}

export default Port
