import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'
import Direction from '@/types/enums/Direction'
import { t } from '@/utils/i18n'

export default function itemFactory (id: string, type: ItemType, subtype: ItemSubtype, ports?: Record<Direction, Port[]>): Item {
  const defaultNameKey = subtype === ItemSubtype.None
    ? type
    : subtype

  return {
    id,
    defaultName: t(`itemType.${defaultNameKey}`),
    name: '',
    type,
    subtype,
    portIds: Object
      .values(ports || {})
      .reduce((portIds, ports) => portIds.concat(ports.map(({ id }) => id)), [] as string[]),
    groupId: null,
    rotation: 0,
    boundingBox: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    position: {
      x: 0,
      y: 0
    },
    zIndex: 0,
    width: 0,
    height: 0,
    isSelected: false,
    properties: {
      name: {
        type: 'text',
        label: t('propertyName.name'),
        value: ''
      }
    }
  }
}
