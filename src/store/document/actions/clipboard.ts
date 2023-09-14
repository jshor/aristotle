import LogicValue from '@/types/enums/LogicValue'
import { DocumentStoreInstance } from '..'
import idMapper from '@/utils/idMapper'
import ItemType from '@/types/enums/ItemType'
import getConnectionChain from '@/utils/getConnectionChain'
import ClipboardData from '@/types/interfaces/ClipboardData'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'
import Connection from '@/types/interfaces/Connection'

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
  if (!this.hasSelectedItems) {
    return window.api.beep()
  }

  const items: Record<string, Item> = {}
  const ports: Record<string, Port> = {}
  const connections: Record<string, Connection> = {}
  const orphanedConnectionChainIds = new Set<string>()
  const connectedPortIds = new Set<string>()
  const freeportIds = new Set<string>()

  this.selectedItemIds.forEach(id => {
    items[id] = this.items[id]
    items[id].portIds.forEach(portId => {
      ports[portId] = this.ports[portId]
    })

    if (items[id].type === ItemType.Freeport) {
      freeportIds.add(id)
    }
  })

  Object
    .values(this.selectedConnectionIds)
    .forEach(id => {
      const connection = this.connections[id]

      connections[id] = connection

      if (ports[connection.source] && ports[connection.target]) {
        // this is a valid connection (i.e., connected at both the source and target to selected items)
        // take note that these are valid port IDs
        connectedPortIds.add(connection.source)
        connectedPortIds.add(connection.target)
      } else {
        // the connection is orphaned (i.e., not connected to any selected item at its source and/or its target)
        // the entire chain is therefore invalid
        orphanedConnectionChainIds.add(connection.connectionChainId)
      }
    })


  // prune connections and freeports (and their ports) from orphaned connection chains
  orphanedConnectionChainIds.forEach(chainId => {
    const chain = getConnectionChain(connections, ports, chainId)

    chain.connectionIds.forEach(id => delete connections[id])
    chain.freeportIds.forEach(id => {
      items[id]
        ?.portIds
        .forEach(portId => delete ports[portId])

      freeportIds.delete(id)
      delete items[id]
    })
  })

  // prune any remaining freeports that are not connected to anything selected
  freeportIds.forEach(id => {
    const isConnected = !!items[id]
      .portIds
      .find(id => connectedPortIds.has(id))

    if (!isConnected) {
      delete items[id]
    }
  })

  const groups = this
    .selectedGroupIds
    .filter(id => id !== null)
    .reduce((map, id) => ({
      ...map,
      [id!]: this.groups[id!]
    }), {})

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

    // select all pasted items
    Object
      .keys(mapped.items)
      .concat(Object.keys(mapped.groups))
      .concat(Object.keys(mapped.connections))
      .forEach(id => this.setSelectionState({ id, value: true }))

    // move the newly-pasted items 20 pixels to the right and down
    const item = Object
      .values(mapped.items)
      .find(item => item.type !== ItemType.Freeport)!

    requestAnimationFrame(() => {
      this.setSelectionPosition({
        id: item.id,
        position: {
          x: item.position.x + (parsed.pasteCount * 20), // TODO: 20 should be a constant and should be a multiple of the grid size
          y: item.position.y + (parsed.pasteCount * 20)
        }
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
