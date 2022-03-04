export default function getConnectionChain (connections: Connection[], portMap: { [id: string]: Port }, connectionChainId: string) {
  return Object
    .values(connections)
    .reduce(({ connectionIds, freeportIds }, connection) => {
      if (connectionChainId === connection.connectionChainId) {
        const sourcePort = portMap[connection.source]
        const targetPort = portMap[connection.target]

        connectionIds.push(connection.id)

        if (sourcePort?.isFreeport) freeportIds.push(sourcePort.elementId)
        if (targetPort?.isFreeport) freeportIds.push(targetPort.elementId)
      }

      return { connectionIds, freeportIds }
    }, {
      connectionIds: [] as string[],
      freeportIds: [] as string[]
    })
}
