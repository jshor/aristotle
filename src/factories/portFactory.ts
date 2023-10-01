import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import Port from '@/types/interfaces/Port'

export default function portFactory (elementId: string, id: string, orientation: Direction, type: PortType): Port {
  return {
    id,
    orientation,
    defaultName: type === PortType.Input
      ? 'Input Port' // TODO: this should be translated
      : 'Output Port',
    name: '',
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
    connectedPortIds: []
  }
}
