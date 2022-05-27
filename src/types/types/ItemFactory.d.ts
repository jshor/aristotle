declare global {
  type ItemFactory = (...any) => { item: Item, ports: Port[] }
}

export default ItemFactory
