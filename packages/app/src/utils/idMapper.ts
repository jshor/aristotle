import ItemType from '@/types/enums/ItemType'
import { cloneDeep } from 'lodash' // TODO

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

type IdMap = Record<string, string>

function mapConnections (connections: Record<string, Connection>, idMap: IdMap) {
  Object
    .values(connections)
    .forEach(connection => {
      const oldId = connection.id
      const newId = rand()

      idMap[oldId] = newId
      connections[newId] = cloneDeep<Connection>(connection)
      connections[newId].id = newId
      connections[newId].source = idMap[connections[newId].source]
      connections[newId].target = idMap[connections[newId].target]

      delete connections[oldId]
    })

    return connections
}

function mapConnectionChainIds (connections: Record<string, Connection>, idMap: IdMap) {
  Object
    .values(connections)
    .forEach(connection => {
      connections[connection.id].connectionChainId = idMap[connections[connection.id].connectionChainId]
    })

  return connections
}

function mapItems (items: Record<string, Item>, idMap: IdMap) {
  Object
    .values(items)
    .forEach(item => {
      const oldId = item.id
      const newId = rand()

      idMap[oldId] = newId
      items[newId] = cloneDeep<Item>(item)
      items[newId].id = newId
      items[newId].portIds = item.portIds.map(oldId => idMap[oldId])

      delete items[oldId]
    })

    return items
}

function mapItemIds (ports: Record<string, Port>, idMap: IdMap) {
  Object
    .values(ports)
    .forEach(port => {
      ports[port.id].elementId = idMap[port.elementId]
    })

  return ports
}

function mapPorts (ports: Record<string, Port>, idMap: IdMap) {
  Object
    .values(ports)
    .forEach(port => {
      const oldId = port.id
      const newId = rand()

      idMap[oldId] = newId
      ports[newId] = cloneDeep<Port>(port)
      ports[newId].id = newId

      delete ports[oldId]
    })

  return ports
}


function mapIntegratedCircuitIds (integratedCircuitItem: Item, integratedCircuitPorts: Record<string, Port>) {
  if (!integratedCircuitItem.integratedCircuit) return {
    integratedCircuitItem,
    integratedCircuitPorts
  }

  const idMap: IdMap = {}
  let { items, connections, ports } = integratedCircuitItem.integratedCircuit

  const newItemId = rand()

  idMap[integratedCircuitItem.id] = newItemId

  ports = mapPorts(ports, idMap)
  items = mapItems(items, idMap)
  connections = mapConnections(connections, idMap)
  connections = mapConnectionChainIds(connections, idMap)
  ports = mapItemIds(ports, idMap)

  Object
    .values(integratedCircuitPorts)
    .forEach(port => {
      const oldPortId = port.id
      const newPortId = rand()

      idMap[oldPortId] = newPortId

      integratedCircuitPorts[newPortId] = cloneDeep(port)
      integratedCircuitPorts[newPortId].id = newPortId
      integratedCircuitPorts[newPortId].elementId = newItemId

      const virtualId = integratedCircuitPorts[newPortId].virtualElementId

      if (virtualId) {
        integratedCircuitPorts[newPortId].virtualElementId = idMap[virtualId]

        items[idMap[virtualId]].portIds.push(newPortId)
        items[idMap[virtualId]].type = ItemType.OutputNode // TODO: does this belong here?
      }

      delete integratedCircuitPorts[oldPortId]
    })

  integratedCircuitItem.id = newItemId
  integratedCircuitItem.portIds = Object.keys(integratedCircuitPorts)
  integratedCircuitItem.integratedCircuit = {
    items,
    connections,
    ports
  }

  return {
    integratedCircuitItem,
    integratedCircuitPorts
  }
}

export default {
  mapConnections,
  mapConnectionChainIds,
  mapItems,
  mapItemIds,
  mapPorts,
  mapIntegratedCircuitIds
}
