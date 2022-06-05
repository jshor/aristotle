declare global {
  interface IntegratedCircuit {
    items: Record<string, Item>
    connections: Record<string, Connection>
    ports: Record<string, Port>
    groups: Record<string, Group>
    serializedState: string
  }
}

export default IntegratedCircuit
