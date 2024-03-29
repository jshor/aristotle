import ItemSubtype from '@/types/enums/ItemSubtype'
import inputFactory from './inputFactory'
import ItemFactory from '@/types/types/ItemFactory'

const clockFactory: ItemFactory = () => inputFactory(ItemSubtype.Clock, {
  interval: {
    label: 'Interval',
    value: 1000,
    type: 'number',
    min: 100,
    step: 100
  }
})

export default clockFactory
