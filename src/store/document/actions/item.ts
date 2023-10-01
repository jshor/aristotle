import { v4 as uuid } from 'uuid'
import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import PortType from '@/types/enums/PortType'
import Direction from '@/types/enums/Direction'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import Port from '@/types/interfaces/Port'
import ItemProperties from '@/types/interfaces/ItemProperties'
import Item from '@/types/interfaces/Item'
import Point from '@/types/interfaces/Point'
import { getSequencedName } from '@/utils/getSequencedName'
import portFactory from '@/factories/portFactory'

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

  item.isSelected = false

  this.items[item.id] = item
  this.items[item.id].zIndex = ++this.zIndex

  this.setProperties(item.id, item.properties)
  this.addVirtualNode(item, portList)
  this.setItemBoundingBox(item.id)

  item
    .portIds
    .forEach(id => this.addPort(item.id, portList[id]))

  this.resetItemValue(item)
  this.addClock(item)
  this.setItemName(item)
}

/**
 * Sets the item's name.
 * If the name already exists in the document, a sequenced name will be generated.
 * Example: 'MyNode', 'MyNode 2', etc.
 */
export function setItemName (this: DocumentStoreInstance, item: Item) {
  if (!item.properties.name) return // do nothing if the item cannot have its name defined

  const itemNames = new Set(
    Object
      .values(this.items)
      .map(({ properties }) => properties.name?.value || '')
      .filter(name => name)
  )

  item.properties.name.value = getSequencedName(item.properties.name.value || item.defaultName, itemNames)
  item.portIds.forEach(id => this.setPortName(id))
}

/**
 * Inserts the given item and its ports into the document.
 * If no document position is given, the item will be placed in the center of the viewport.
 */
export function insertItemAtPosition (this: DocumentStoreInstance, { item, ports }: { item: Item, ports?: Record<Direction, Port[]> }, documentPosition: Point | null = null) {
  if (!documentPosition) {
    const midpoint = boundaries.getBoundingBoxMidpoint(this.viewport)

    documentPosition = {
      x: midpoint.x + this.viewport.left,
      y: midpoint.y + this.viewport.top
    }
  }

  if (documentPosition.x < this.viewport.left || documentPosition.x > this.viewport.right ||
    documentPosition.y < this.viewport.top || documentPosition.y > this.viewport.bottom) {
    return // do not add the item if it is outside the viewport
  }

  const position = fromDocumentToEditorCoordinates(this.canvas, this.viewport, documentPosition, this.zoomLevel)

  position.x -= item.width / 2
  position.y -= item.height / 2

  item.position = position

  this.commitState()
  this.addItem({
    item,
    ports: Object
      .values(ports || {})
      .reduce((map: Record<string, Port>, ports) => {
        return ports.reduce((m, port) => ({ ...m, [port.id]: port }), map)
      }, {})
  })
  this.setItemBoundingBox(item.id)
  this.setItemSelectionState(item.id, true)
}

/**
 * Resets the item output value to its predefined start value (if any).
 */
export function resetItemValue (this: DocumentStoreInstance, item: Item) {
  const property = item.properties?.startValue

  if (!property) return

  const value = property.value as number

  item.portIds.forEach(id => this.setPortValue({ id, value }))
}

/**
 * Removes an element and all its associated ports and circuit nodes from the state.
 */
export function removeElement (this: DocumentStoreInstance, id: string) {
  const item = this.items[id]

  if (!item) return

  this.removeVirtualNode(item.id)
  this.oscillator.remove(item.clock!)
  this.selectedItemIds.delete(item.id)

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
  const oldCount = item.properties.inputCount!.value

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
      this.addPort(id, portFactory(id, portId, Direction.Left, PortType.Input))
      this.setPortName(portId)
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
export function setProperties (this: DocumentStoreInstance, id: string, properties: ItemProperties) {
  const item = this.items[id]

  for (const propertyName in properties) {
    const key = propertyName as keyof Item['properties']
    const property = properties[key]

    if (!property || item.properties[key]?.value === property.value) {
      continue // do nothing if the property value has not changed
    }

    this.commitState()

    switch (key) {
      case 'inputCount':
        this.setInputCount(id, properties.inputCount!.value)
        break
      case 'interval':
        if (item.clock) {
          item.clock.interval = properties.interval!.value
        }
        break
    }

    this.items[id].properties[key]!.value = property!.value
  }
}
