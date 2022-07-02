import ItemSubtype from '@/types/enums/ItemSubtype'
import inputFactory from './inputFactory'

const clockFactory: ItemFactory = () => inputFactory(ItemSubtype.Clock, 60, 60, {
  interval: {
    label: 'Interval',
    value: 1000,
    type: 'number',
    min: 100,
    step: 100
  }
})

export default clockFactory
