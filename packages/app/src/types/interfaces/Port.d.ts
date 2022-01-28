import PortType from '../enums/PortType'

declare global {
  interface Port {
    id: string
    position: Point
    type: PortType
    rotation: number
    orientation: number
    isFreeport: boolean
  }
}

export default Port
