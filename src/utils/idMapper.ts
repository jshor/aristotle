import Connection from '@/types/interfaces/Connection'
import Group from '@/types/interfaces/Group'
import Port from '@/types/interfaces/Port'
import SerializableState from '@/types/interfaces/SerializableState'
import Item from '@/types/interfaces/Item'
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

        group.itemIds = group.itemIds.map(oldId => idMap[oldId])
        group.connectionIds = group.connectionIds.map(oldId => idMap[oldId])
        group.id = newId

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
        }
          items[newId].id = newId

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
    // give the ports new IDs
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

    // apply those IDs to their lists of connected port IDs
    Object
      .values(ports)
      .forEach(port => {
        ports[port.id].connectedPortIds = port.connectedPortIds.map(oldId => idMap[oldId])
      })

    return ports
  }

  ports = mapPorts(ports)
  items = mapItems(items)
  ports = mapItemIds(ports)
  connections = mapConnections(connections)
  groups = mapGroups(groups)

  return {
    ...mapGroupIds(connections, items),
    ports,
    groups
  }
}

function mapIntegratedCircuitIds (item: Item) {
  // TODO: this function can probably be removed
  if (!item.integratedCircuit) return item

  const { items } = mapStandardCircuitIds({
    items: {
      [item.id]: item
    },
    connections: {},
    ports: {},
    groups: {}
  })
  const mappedItem = Object.values(items)[0]

  mappedItem.id = uuid()

  return mappedItem // Object.values(items)[0]
}

export default {
  mapStandardCircuitIds,
  mapIntegratedCircuitIds
}
