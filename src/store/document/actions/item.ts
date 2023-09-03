import { v4 as uuid } from 'uuid'
import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import PortType from '@/types/enums/PortType'
import Direction from '@/types/enums/Direction'
import ItemSubtype from '@/types/enums/ItemSubtype'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import ItemType from '@/types/enums/ItemType'
import ClockService from '@/services/ClockService'

/**
 * Adds any non-IC component to the state.
 *
 * @param payload
 * @param payload.item - new item to add
 * @param payload.ports - mapping of IDs-to-ports, containing a subset of ports belonging to the new item
 */
export function addItem (this: DocumentStoreInstance, { item, ports }: { item: Item, ports: Record<string, Port> }) {
  // add all ports associated to this item
  // if the item is an integrated circuit, only add the ports that it defines (ones visible to the user)
  const portList = item.integratedCircuit?.ports || ports

  item
    .portIds
    .forEach(portId => {
      const port = portList[portId]

      if (port) {
        this.ports[port.id] = port

        if (port.isMonitored) {
          // any existing wave is now be disconnected from signal changes since this is a new instance of Item
          delete port.wave

          // unmonitor the existing wave, if applicable
          this.unmonitorPort(port.id)

          // wait for next JS frame so that the oscillogram broadcast (with the port wave removed) completes first
          // then the port can be re-monitored with the new wave
          // TODO: this may not be needed anymore now that tiny-emitter has been replaced
          setTimeout(() => this.monitorPort(port.id))
        }
      }
    })

  // TODO: the naming scheme here is really messed up - sometimes copy+pasting items will create names like 'Clock 2 2 2'
  // think of a better way to autoname items
  const itemNames = Object
    .values(this.items)
    .map(({ name }) => name)
  const originalName = item.name || item.subtype

  let name = originalName
  let c = 1

  while (itemNames.includes(name)) {
    name = `${originalName} ${++c}`
  }

  item.name = name
  item.clock = ClockService.deserialize(item.clock)
  item.isSelected = false

  // add the item to the document and create its corresponding circuit node
  this.items[item.id] = item
  this.items[item.id].zIndex = ++this.zIndex

  this.addVirtualNode(item)
  this.resetItemValue(item)
  this.setProperties(item.id, item.properties)
  this.setItemBoundingBox(item.id)
}

export function insertItemAtPosition (this: DocumentStoreInstance, { item, ports }: { item: Item, ports: Port[] }, documentPosition: Point | null = null) {
  if (!documentPosition) {
    const midpoint = boundaries.getBoundingBoxMidpoint(this.viewport)

    documentPosition = {
      x: midpoint.x + this.viewport.left,
      y: midpoint.y + this.viewport.top
    }
  }

  const position = fromDocumentToEditorCoordinates(this.canvas, this.viewport, documentPosition, this.zoomLevel)

  position.x -= item.width / 2
  position.y -= item.height / 2

  item.position = position

  this.commitState()
  this.addItem({
    item,
    ports: ports.reduce((map: Record<string, Port>, port) => ({ ...map, [port.id]: port }), {})
  })
  this.setItemBoundingBox(item.id)
  this.setSelectionState({ id: item.id, value: true })
}

export function resetItemValue (this: DocumentStoreInstance, item: Item) {
  const property = item.properties?.startValue

  if (!property) return

  const value = property.value as number

  item.portIds.forEach(id => this.setPortValue({ id, value }))
}

/**
 * Removes an element and all its associated ports and circuit nodes from the state.
 *
 * @param id - ID of the item to remove
 */
export function removeElement (this: DocumentStoreInstance, id: string) {
  const item = this.items[id]

  if (!item) return
  if (item.type === ItemType.Freeport) {
    this.disconnectFreeport(id)
  }

  this.removeVirtualNode(item.id)

  // remove all ports associated with the item
  const ids = [...item.portIds]

  ids.forEach(portId => this.removePort(portId))

  // remove the item
  delete this.items[id]
}

/**
 * Sets the number of input ports that a LogicGate should have.
 * If the number is less than the current number of ports, take away the difference number of existing ports.
 *
 * @param payload
 * @param payload.id - LogicGate ID
 * @param payload.count - new number of input ports
 */
 export function setInputCount (this: DocumentStoreInstance, id: string, count: number) {
  const item = this.items[id]
  const oldCount = item.properties.inputCount.value as number

  if (oldCount > count) {
    // if the count has decreased, find the last remaining port IDs which will be removed
    this.items[id].portIds
      .filter(portId => this.ports[portId].type === PortType.Input)
      .slice(count)
      .forEach(portId => this.removePort(portId))
  } else {
    for (let i = oldCount; i < count; i++) {
      const portId = uuid()

      // add the difference of ports one by one
      this.addPort(id, {
        id: portId,
        name: '', // TODO
        connectedPortIds: [],
        type: PortType.Input,
        elementId: id,
        virtualElementId: id,
        orientation: Direction.Left,
        isFreeport: false,
        isMonitored: false,
        hue: 0,
        position: {
          x: 0,
          y: 0
        },
        rotation: 0,
        value: 0
      })
    }
  }
}

/**
 * Updates the properties values. If no properties have changed, then no changes will take effect.
 * This will perform any actions necessary to occur when a property value changes.
 *
 * @param payload
 * @param payload.id - item ID
 * @param payload.properties - new version of the properties
 */
export function setProperties (this: DocumentStoreInstance, id: string, properties: PropertySet) {
  const item = this.items[id]

  for (const propertyName in properties) {
    const property = properties[propertyName]

    if (item.properties[propertyName].value === property.value) {
      continue // do nothing if the property value has not changed
    }

    this.commitState()

    switch (propertyName) {
      case 'inputCount':
        this.setInputCount(id, property.value as number)
        break
      case 'interval':
        if (item.clock) {
          item.clock.interval = property.value as number
        }
        break
    }

    this.items[id].properties[propertyName].value = property.value
  }
}
