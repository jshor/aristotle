import { v4 as uuid } from 'uuid'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import itemFactory from './itemFactory'
import portFactory from './portFactory'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import ItemProperties from '@/types/interfaces/ItemProperties'
import ItemFactory from '@/types/types/ItemFactory'
import Port from '@/types/interfaces/Port'
import LogicValue from '@/types/enums/LogicValue'
import { t } from '@/utils/i18n'

const inputFactory: ItemFactory = (type: ItemSubtype, properties: ItemProperties = {}) => {
  const elementId = uuid()
  const ports: Record<Direction, Port[]> = {
    [Direction.Left]: [],
    [Direction.Top]: [],
    [Direction.Bottom]: [],
    [Direction.Right]: [
      portFactory(elementId, uuid(), Direction.Right, PortType.Output)
    ]
  }
  const item = itemFactory(elementId, ItemType.InputNode, type, ports)

  item.properties = {
    ...item.properties,
    ...properties,
    startValue: {
      label: t('propertyName.startValue'),
      value: LogicValue.FALSE,
      type: 'number',
      options: {
        [t('propertyOption.true')]: LogicValue.TRUE,
        [t('propertyOption.hiz')]: LogicValue.UNKNOWN,
        [t('propertyOption.false')]: LogicValue.FALSE
      }
    },
  }

  return { item, ports }
}

export default inputFactory
