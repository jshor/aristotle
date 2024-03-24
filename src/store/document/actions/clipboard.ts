import LogicValue from '@/types/enums/LogicValue'
import { DocumentStoreInstance } from '..'
import idMapper from '@/utils/idMapper'
import ClipboardData from '@/types/interfaces/ClipboardData'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'
import Connection from '@/types/interfaces/Connection'
import Group from '@/types/interfaces/Group'

/**
 * Performs a clipboard cut operation.
 */
export function cut (this: DocumentStoreInstance) {
  this.copy()
  this.deleteSelection()
}

/**
 * Copies selected editor elements to the clipboard.
 */
export function copy (this: DocumentStoreInstance) {
  const items: Record<string, Item> = {}
  const ports: Record<string, Port> = {}
  const connections: Record<string, Connection> = {}
  const groups: Record<string, Group> = {}

  this.selectedItemIds.forEach(id => {
    items[id] = this.items[id]
    items[id].portIds.forEach(portId => {
      ports[portId] = {
        ...this.ports[portId],
        connectedPortIds: []
      }
    })
  })

  this
    .selectedConnectionIds
    .forEach(id => {
      const connection = this.connections[id]

      if (ports[connection.source] && ports[connection.target]) {
        connections[id] = connection
      }
    })

  this
    .selectedGroupIds
    .forEach(id => groups[id] = this.groups[id])

  const clipboardData: ClipboardData = {
    items,
    ports,
    connections,
    groups,
    pasteCount: 1
  }

  if (Object.keys(clipboardData.items).length) {
    window.api.setClipboardContents(JSON.stringify(clipboardData))
  } else {
    window.api.beep()
  }
}

/**
 * Pastes clipboard elements to the editor.
 */
export function paste (this: DocumentStoreInstance) {
  if (!window.api.canPaste()) {
    return window.api.beep()
  }

  try {
    const state = window.api.getClipboardContents()
    const parsed = JSON.parse(state as string) as ClipboardData
    const mapped = idMapper.mapStandardCircuitIds(parsed) as ClipboardData

    this.commitState()
    this.deselectAll()

    // reset the ports
    Object
      .keys(mapped.ports)
      .forEach(portId => {
        const port = mapped.ports[portId]

        port.value = LogicValue.UNKNOWN
        port.isMonitored = false

        delete port.wave
      })

    this.applyDeserializedState({
      items: {
        ...this.items,
        ...mapped.items
      },
      connections: {
        ...this.connections,
        ...mapped.connections
      },
      ports: {
        ...this.ports,
        ...mapped.ports
      },
      groups: {
        ...this.groups,
        ...mapped.groups
      }
    })

    // select all pasted items (groups and controlPoints are automatically selected)
    Object
      .keys(mapped.items)
      .forEach(id => this.setItemSelectionState(id, true))

    Object
      .keys(mapped.connections)
      .forEach(id => this.setConnectionSelectionState(id, true))

    // move the newly-pasted items 20 pixels to the right and down
    const item = Object.values(mapped.items)[0]

    requestAnimationFrame(() => {
      this.setSelectionPosition({
        x: parsed.pasteCount * 20, // TODO: 20 should be a constant and should be a multiple of the grid size
        y: parsed.pasteCount * 20
      })
    })

    // update the clipboard data with the paste count incremented
    const clipboardData: ClipboardData = {
      ...JSON.parse(state),
      pasteCount: parsed.pasteCount + 1
    }

    window.api.setClipboardContents(JSON.stringify(clipboardData))
  } catch (_) {
    window.api.clearClipboard()
    window.api.beep()
  }
}
