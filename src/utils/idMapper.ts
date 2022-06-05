import cloneDeep from 'lodash.clonedeep'
import { v4 as uuid } from 'uuid'

type IdMap = Record<string, string>

function mapStandardCircuitIds (circuit: SerializableState, idMap: IdMap = {}) {

  let { items, connections, ports, groups } = cloneDeep(circuit)

  function mapGroups (groups: Record<string, Group>) {
    Object
      .values(groups)
      .forEach(group => {
        const oldId = group.id
        const newId = uuid()

        idMap[oldId] = newId
        groups[newId] = cloneDeep(group)

        delete groups[oldId]
      })

    return groups
  }

  function mapGroupIds (connections: Record<string, Connection>, items: Record<string, Item>) {
    Object
      .values(connections)
      .forEach(connection => {
        connection.groupId = connection.groupId !== null
          ? idMap[connection.groupId]
          : null
      })

    Object
      .values(items)
      .forEach(item => {
        item.groupId = item.groupId !== null
          ? idMap[item.groupId]
          : null
      })

    return { connections, items }
  }

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

        idMap[oldId] = newId
        items[newId] = cloneDeep<Item>(item)

        if (item.integratedCircuit) {
          items[newId].integratedCircuit = {
            serializedState: item.integratedCircuit.serializedState,
            ...mapStandardCircuitIds(cloneDeep(item.integratedCircuit), idMap)
          }
        } else {
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
  groups = mapGroups(groups)

  return {
    ...mapGroupIds(connections, items),
    ports,
    groups
  }
}

function mapIntegratedCircuitIds (item: Item) {
  if (!item.integratedCircuit) return item

  const { items } = mapStandardCircuitIds({
    items: {
      [item.id]: item
    },
    connections: {},
    ports: {},
    groups: {}
  })

  return Object.values(items)[0]
}

export default {
  mapStandardCircuitIds,
  mapIntegratedCircuitIds
}
