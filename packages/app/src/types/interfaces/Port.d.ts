import PortType from '../enums/PortType'

declare global {
  interface Port {
    id: string
    elementId: string
    position: Point
    type: PortType
    rotation: number
    orientation: number
    value: number
    isFreeport: boolean
  }
}

export default Port
