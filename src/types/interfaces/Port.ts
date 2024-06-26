import BinaryWavePulse from '@/store/document/oscillator/BinaryWavePulse'
import PortType from '../enums/PortType'
import ControlPoint from './ControlPoint'

interface Port extends ControlPoint {
  id: string
  defaultName: string
  name: string
  elementId: string
  type: PortType
  value: number
  hue: number
  isMonitored: boolean
  connectedPortIds: string[]
  wave?: BinaryWavePulse
}

export default Port
