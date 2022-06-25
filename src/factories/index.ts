import clockFactory from './clockFactory'
import inputFactory from './inputFactory'
import digitDisplayFactory from './digitDisplayFactory'
import lightbulbFactory from './lightbulbFactory'
import logicGateFactory from './logicGateFactory'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'

type FactoryDictionary = {
  [type: string]: {
    [subtype: string]: ItemFactory
  }
}

export default {
  [ItemType.InputNode]: {
    [ItemSubtype.Switch]: inputFactory.bind(this, ItemSubtype.Switch, 60, 60),
    [ItemSubtype.Clock]: clockFactory
  },
  [ItemType.OutputNode]: {
    [ItemSubtype.Lightbulb]: lightbulbFactory,
    [ItemSubtype.DigitDisplay]: digitDisplayFactory
  },
  [ItemType.LogicGate]: {
    [ItemSubtype.And]: logicGateFactory.bind(this, ItemSubtype.And, 140, 50),
    [ItemSubtype.Nand]: logicGateFactory.bind(this, ItemSubtype.Nand, 140, 50),
    [ItemSubtype.Xnor]: logicGateFactory.bind(this, ItemSubtype.Xnor, 140, 50),
    [ItemSubtype.Nor]: logicGateFactory.bind(this, ItemSubtype.Nor, 140, 50),
    [ItemSubtype.Or]: logicGateFactory.bind(this, ItemSubtype.Or, 140, 50),
    [ItemSubtype.Not]: logicGateFactory.bind(this, ItemSubtype.Not, 140, 50, 1)
  }
} as FactoryDictionary
