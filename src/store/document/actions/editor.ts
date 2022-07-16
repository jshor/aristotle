import { DocumentStoreInstance } from '..'

export function loadDocument (this: DocumentStoreInstance, document: string) {
  const parsed = JSON.parse(document)
  const state = parsed.integratedCircuit
    ? JSON.stringify(parsed.integratedCircuit)
    : document

  this.applyState(state)
  this.resetCircuit()
}

export function print (this: DocumentStoreInstance) {
  this.isPrinting = true
}

export function createImage (this: DocumentStoreInstance) {
  this.isCreatingImage = true
}


export function clearStatelessInfo (this: DocumentStoreInstance) {
  this.unsetConnectionPreview()
  this.connectablePortIds = []
  this.selectedConnectionIds = []
  this.selectedItemIds = []
  this.selectedPortIndex = -1
  this.cachedState = null
  this.activePortId = null
  this.connectionPreviewId = null
}

export function clearBaseItems (this: DocumentStoreInstance, itemIds: string[], connectionIds: string[], groupIds: string[]) {
  const portIds = itemIds.reduce((portIds, itemId) => {
    return portIds.concat(this.items[itemId].portIds)
  }, [] as string[])
  const connectionChainIds = new Set<string>()

  Object
    .values(this.connections)
    .forEach(({ source, target, connectionChainId }) => {
      if (portIds.includes(source) || portIds.includes(target)) {
        connectionChainIds.add(connectionChainId)
      }
    })

  const connections = Object
    .values(this.connections)
    .filter(({ connectionChainId }) => connectionChainIds.has(connectionChainId))
    .concat(connectionIds.map(id => this.connections[id]))

  connections.forEach(connection => {
    this.disconnect(connection)

    if (this.ports[connection.source]?.isFreeport) {
      // if the source is a freeport, remove its parent item
      this.removeElement(this.ports[connection.source].elementId)
    }
  })
  itemIds.forEach(this.removeElement)
  groupIds.forEach(groupId => {
    delete this.groups[groupId]
  })
}
