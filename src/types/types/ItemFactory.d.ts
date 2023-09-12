import Direction from "../enums/Direction"

type ItemFactory = (...any) => { item: Item, ports: Record<Direction, Port[]> }

export default ItemFactory
