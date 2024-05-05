import ItemSubtype from '@/types/enums/ItemSubtype'
import inputFactory from './inputFactory'
import ItemFactory from '@/types/types/ItemFactory'
import { t } from '@/utils/i18n'

const clockFactory: ItemFactory = () => inputFactory(ItemSubtype.Clock, {
  interval: {
    label: t('propertyName.interval'),
    value: 1000,
    type: 'number',
    min: 100,
    step: 100
  }
})

export default clockFactory
