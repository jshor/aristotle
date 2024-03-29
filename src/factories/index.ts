import clockFactory from './clockFactory'
import inputFactory from './inputFactory'
import digitDisplayFactory from './digitDisplayFactory'
import lightbulbFactory from './lightbulbFactory'
import logicGateFactory from './logicGateFactory'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemFactory from '@/types/types/ItemFactory'

type FactoryDictionary = {
  [type: string]: {
    [subtype: string]: ItemFactory
  }
}

export default {
  [ItemType.InputNode]: {
    [ItemSubtype.Switch]: inputFactory.bind(this, ItemSubtype.Switch),
    [ItemSubtype.Clock]: clockFactory
  },
  [ItemType.OutputNode]: {
    [ItemSubtype.Lightbulb]: lightbulbFactory,
    [ItemSubtype.DigitDisplay]: digitDisplayFactory
  },
  [ItemType.LogicGate]: {
    [ItemSubtype.And]: logicGateFactory.bind(this, ItemSubtype.And),
    [ItemSubtype.Nand]: logicGateFactory.bind(this, ItemSubtype.Nand),
    [ItemSubtype.Xnor]: logicGateFactory.bind(this, ItemSubtype.Xnor),
    [ItemSubtype.Nor]: logicGateFactory.bind(this, ItemSubtype.Nor),
    [ItemSubtype.Or]: logicGateFactory.bind(this, ItemSubtype.Or),
    [ItemSubtype.Not]: logicGateFactory.bind(this, ItemSubtype.Not, 1)
  }
} satisfies FactoryDictionary
