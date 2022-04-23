import ItemType from '@/types/enums/ItemType'
import { cloneDeep } from 'lodash' // TODO
import { v4 as uuid } from 'uuid'

type IdMap = Record<string, string>

function mapCircuit (circuit: { connections: Record<string, Connection>, items: Record<string, Item>, ports: Record<string, Port> }, idMap: IdMap = {}) {

  let { items, connections, ports } = cloneDeep(circuit)

  function mapConnections (connections: Record<string, Connection>) {
    Object
      .values(connections)
      .forEach(connection => {
        const oldId = connection.id
        const newId = uuid()

        idMap[oldId] = newId
        connections[newId] = cloneDeep<Connection>(connection)
        connections[newId].id = newId
        connections[newId].source = idMap[connections[newId].source]
        connections[newId].target = idMap[connections[newId].target]

        delete connections[oldId]
      })

      return connections
  }

  function mapConnectionChainIds (connections: Record<string, Connection>) {
    Object
      .values(connections)
      .forEach(connection => {
        connections[connection.id].connectionChainId = idMap[connections[connection.id].connectionChainId]
      })

    return connections
  }

  function mapItems (items: Record<string, Item>) {
    Object
      .values(items)
      .forEach(item => {
        const oldId = item.id
        const newId = uuid()

        if (item.integratedCircuit) {
          idMap[oldId] = newId
          items[newId] = item
          items[newId].integratedCircuit = cloneDeep(mapCircuit(cloneDeep(item.integratedCircuit), idMap))
          // items[newId].portIds = items[newId].portIds.map(oldId => idMap[oldId])
        } else {
          idMap[oldId] = newId
          items[newId] = cloneDeep<Item>(item)
          items[newId].id = newId
        }

        items[newId].portIds = item.portIds.map(oldId => idMap[oldId])

        delete items[oldId]
      })

      return items
  }

  function mapItemIds (ports: Record<string, Port>) {
    Object
      .values(ports)
      .forEach(port => {
        ports[port.id].elementId = idMap[port.elementId]
      })

    return ports
  }

  function mapPorts (ports: Record<string, Port>) {
    Object
      .values(ports)
      .forEach(port => {
        const oldId = port.id
        const newId = uuid()

        idMap[oldId] = newId
        ports[newId] = cloneDeep<Port>(port)
        ports[newId].id = newId

        delete ports[oldId]
      })

    return ports
  }

  ports = mapPorts(ports)
  items = mapItems(items)
  ports = mapItemIds(ports)
  connections = mapConnections(connections)
  connections = mapConnectionChainIds(connections)

  Object
    .values(items)
    .forEach(item => {
      // item.portIds = item.portIds.map(oldId => idMap[oldId])
    })

  return {
    items,
    connections,
    ports
  }
}

export default mapCircuit
