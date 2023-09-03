/**
 * Returns all connections and any associated freeport items within a connection chain.
 *
 * @param connections - list of all connections to explore
 * @param portMap - ID-to-port mapping of the entire document
 * @param connectionChainId - ID of the connection chain to explore
 * @returns the IDs of the connections and the freeports discovered in the chain
 */
export default function getConnectionChain (connections: Record<string, Connection>, portMap: Record<string, Port>, connectionChainId: string) {
  const { connectionIds, freeportIds } = Object
    .values(connections)
    .reduce(({ connectionIds, freeportIds }, connection) => {
      if (connectionChainId === connection.connectionChainId) {
        const sourcePort = portMap[connection.source]
        const targetPort = portMap[connection.target]

        connectionIds.add(connection.id)

        if (sourcePort?.isFreeport) freeportIds.add(sourcePort.elementId)
        if (targetPort?.isFreeport) freeportIds.add(targetPort.elementId)
      }

      return { connectionIds, freeportIds }
    }, {
      connectionIds: new Set<string>(),
      freeportIds: new Set<string>()
    })

  return {
    connectionIds: Array.from(connectionIds),
    freeportIds: Array.from(freeportIds)
  }
}
