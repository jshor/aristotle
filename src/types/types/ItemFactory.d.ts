import Direction from '../enums/Direction'
import Item from '../interfaces/Item'

type ItemFactory = (...any) => { item: Item, ports: Record<Direction, Port[]> }

export default ItemFactory
