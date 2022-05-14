declare global {
  interface Connection extends BaseItem {
    source: string
    target: string
    connectionChainId: string
    groupId: string | null
  }
}

export default Connection
