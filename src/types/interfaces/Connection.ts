import BaseItem from './BaseItem'

interface Connection extends BaseItem {
  /** ID of the connected source port. */
  source: string // TODO: rename to sourceId?
  /** ID of the connected target port. */
  target: string // TODO: rename to targetId?
  /** ID of the connection chain (a linked series of connections joined by freeports). */
  connectionChainId: string
  /** ID of the group that this connection belongs to. */
  groupId: string | null
}

export default Connection
