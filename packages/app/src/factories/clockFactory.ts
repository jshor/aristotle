import ItemSubtype from '@/types/enums/ItemSubtype'
import inputFactory from './inputFactory'

export default function clockFactory () {
  return inputFactory(ItemSubtype.Clock, 60, 60, {
    interval: {
      label: 'Interval',
      value: 1000,
      type: 'number',
      min: 100
    }
  })
}
