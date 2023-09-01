import BinaryWaveService from '@/services/BinaryWaveService'
import PortType from '../enums/PortType'

declare global {
  interface Port {
    id: string
    name: string
    elementId: string
    virtualElementId?: string
    position: Point
    type: PortType
    rotation: number
    orientation: number
    value: number
    hue: number
    isFreeport: boolean
    isMonitored: boolean
    connectedPortIds: string[]
    wave?: BinaryWaveService
  }
}

export default Port
