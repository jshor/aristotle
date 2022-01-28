declare global {
  interface Connection extends BaseItem {
    source: string
    target: string
    trueTargetId: string
    groupId: string | null
    zIndex: number
  }
}

export default Connection
