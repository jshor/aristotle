import Item from './Item'
import Connection from './Connection'
import Group from './Group'
import Port from './Port'

interface SerializableState {
  ports: Record<string, Port>
  items: Record<string, Item>
  connections: Record<string, Connection>
  groups: Record<string, Group>
}

export default SerializableState
