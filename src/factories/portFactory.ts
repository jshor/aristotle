import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import Port from '@/types/interfaces/Port'
import { t } from '@/utils/i18n'

export default function portFactory (elementId: string, id: string, orientation: Direction, type: PortType): Port {
  const typeKey = type === PortType.Input ? 'input' : 'output'

  return {
    id,
    orientation,
    defaultName: t(`portType.${typeKey}`),
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
