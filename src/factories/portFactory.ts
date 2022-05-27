import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'

export default function portFactory (elementId: string, id: string, orientation: Direction, type: PortType, name: string): Port {
  return {
    id,
    orientation,
    name,
    position: {
      x: 0,
      y: 0
    },
    type,
    rotation: 0,
    elementId,
    value: 0,
    hue: 0,
    isMonitored: false,
    isFreeport: false,
    connectedPortIds: []
  }
}
