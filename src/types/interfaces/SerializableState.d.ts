declare global {
  interface SerializableState {
    ports: Record<string, Port>
    items: Record<string, Item>
    connections: Record<string, Connection>
    groups: Record<string, Group>
  }
}

export default SerializableState
