declare global {
  type Freeport = {
    itemId: string
    value?: number
    outputPortId?: string
    inputPortId?: string
    sourceId?: string
    targetId?: string
    connectionChainId?: string
  }
}

export default Freeport
