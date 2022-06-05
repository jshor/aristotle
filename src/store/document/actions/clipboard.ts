import { DocumentStoreInstance } from '..'
import idMapper from '@/utils/idMapper'

export function cut (this: DocumentStoreInstance) {
  this.copy()
  this.deleteSelection()
}

export function copy (this: DocumentStoreInstance) {
  if (!this.hasSelection) return

  const items: Record<string, Item> = {}
  const ports: Record<string, Port> = {}

  this.selectedItemIds.forEach(id => {
    items[id] = this.items[id]
    items[id].portIds.forEach(portId => {
      ports[portId] = this.ports[portId]
    })
  })

  const connections = Object
    .values(this.connections)
    .reduce((map, connection) => {
      if (ports[connection.source] && ports[connection.target]) {
        map[connection.id] = connection
      }

      return map
    }, {} as Record<string, Connection>)

  const groups = Object
    .values(this.groups)
    .filter(({ isSelected }) => isSelected)
    .reduce((map, group) => ({ ...map, [group.id]: group }), {})

  const clipboardData: ClipboardData = {
    items,
    ports,
    connections,
    groups,
    pasteCount: 1
  }

  window.api.copy(JSON.stringify(clipboardData))
}

export function paste (this: DocumentStoreInstance) {
  try {
    const state = window.api.paste()
    const parsed = JSON.parse(state as string) as ClipboardData
    const mapped = idMapper.mapStandardCircuitIds(parsed) as ClipboardData

    this.commitState()
    this.deselectAll()

    Object
      .keys(mapped.ports)
      .forEach(portId => {
        mapped.ports[portId].value = 0
      })

    Object
      .values(mapped.items)
      .forEach(item => {
        item.position.x += 20 * parsed.pasteCount
        item.position.y += 20 * parsed.pasteCount
        item.isSelected = false

        this.addItem({
          item,
          ports: mapped.ports
        })
        this.setSelectionState({ id: item.id, value: true })
      })

    Object
      .values(mapped.connections)
      .forEach(connection => this.connect(connection))

    Object
      .values(mapped.groups)
      .forEach(group => {
        this.groups[group.id] = group

        this.setGroupBoundingBox(group.id)
        this.setSelectionState({ id: group.id, value: true })
      })

    const clipboardData: ClipboardData = {
      ...JSON.parse(state),
      pasteCount: parsed.pasteCount + 1
    }

    window.api.copy(JSON.stringify(clipboardData))
  } catch (error) {
    console.log('ERROR: ', error)
    // TODO: clear clipboard?
  }
}
