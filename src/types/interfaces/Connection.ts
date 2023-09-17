import BaseItem from './BaseItem'
import ControlPoint from './ControlPoint'

interface Connection extends BaseItem {
  /** ID of the connected source port. */
  source: string // TODO: rename to sourceId?
  /** ID of the connected target port. */
  target: string // TODO: rename to targetId?
  /** ID of the group that this connection belongs to. */
  groupId: string | null
  controlPoints: ControlPoint[]
}

export default Connection
