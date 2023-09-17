import BinaryWavePulse from '@/store/document/oscillator/BinaryWavePulse'
import PortType from '../enums/PortType'
import ControlPoint from './ControlPoint'

interface Port extends ControlPoint {
  id: string
  name: string
  elementId: string
  integratedCircuitItemId?: string
  virtualElementId?: string
  type: PortType
  value: number
  hue: number
  isMonitored: boolean
  connectedPortIds: string[]
  wave?: BinaryWavePulse
}

export default Port
